/**
 * Halaman Experience: memuat data lewat AJAX, pencarian dengan debouncing,
 * tambah data lewat modal, serta star dan hapus tanpa reload halaman.
 *
 * Bergantung pada utils.js (escapeHtml, safeUrl, getCookie, formatServerErrors)
 * dan toast.js (showToast) yang dimuat oleh base.html.
 */
(function () {
    'use strict';

    const config = JSON.parse(document.getElementById('experience-config').textContent);
    const SEARCH_DEBOUNCE_DELAY = 300;

    // Elemen DOM
    const loadingState = document.getElementById('experience-loading');
    const errorState = document.getElementById('experience-error');
    const emptyState = document.getElementById('experience-empty');
    const emptyMessage = document.getElementById('experience-empty-message');
    const gridContainer = document.getElementById('experience-grid');
    const resultCount = document.getElementById('experience-result-count');
    const retryButton = document.getElementById('experience-retry');
    const searchForm = document.getElementById('experience-search-form');
    const searchInput = document.getElementById('experience-search-input');
    const categoryFilter = document.getElementById('experience-category-filter');

    // Elemen khusus superuser: bisa null untuk peran lain, jadi selalu dicek sebelum dipakai
    const addModal = document.getElementById('add-experience-modal');
    const experienceForm = document.getElementById('experience-form');
    const deleteModal = document.getElementById('delete-experience-modal');
    const deleteName = document.getElementById('delete-experience-name');
    const deleteConfirmButton = document.getElementById('delete-experience-confirm');

    let listAbortController;
    let searchDebounceTimer;
    let pendingDeleteId = null;

    const dateFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' });

    function urlFor(name, experienceId) {
        return config.urls[name].replace(config.placeholderId, experienceId);
    }

    function csrfHeaders() {
        return { 'X-CSRFToken': getCookie('csrftoken'), 'Accept': 'application/json' };
    }

    function currentFilters() {
        return { title: searchInput.value.trim(), category: categoryFilter.value };
    }

    // Menampilkan tepat satu state halaman: loading, error, kosong, atau grid
    function displayPageSection({ showLoading = false, showError = false, showEmpty = false, showGrid = false }) {
        loadingState.classList.toggle('hide', !showLoading);
        errorState.classList.toggle('hide', !showError);
        emptyState.classList.toggle('hide', !showEmpty);
        gridContainer.classList.toggle('hide', !showGrid);
        gridContainer.setAttribute('aria-busy', String(showLoading));
    }

    function updateResultCount(count, filters) {
        const isFiltered = filters.title || filters.category;
        resultCount.textContent = isFiltered && count > 0
            ? `Menemukan ${count} pengalaman.`
            : '';
    }

    // started_at diisi otomatis saat data dibuat (auto_now_add), bukan tanggal mulai
    // pengalaman sebenarnya, jadi yang ditampilkan hanya status dan tanggal selesai.
    function formatStatus(fields) {
        if (fields.is_ongoing) return 'Sedang berlangsung';
        return `Selesai · ${dateFormatter.format(new Date(fields.ended_at))}`;
    }

    // Membuat elemen card. Setiap nilai teks dari server melewati escapeHtml,
    // dan setiap URL melewati safeUrl, sebelum disisipkan ke innerHTML.
    function buildExperienceCard(item) {
        const exp = item.fields;
        const article = document.createElement('article');
        article.className = 'content-card';
        article.dataset.id = item.pk;

        const thumbnailUrl = exp.thumbnail ? safeUrl(exp.thumbnail) : '';
        const thumbnailHtml = thumbnailUrl
            ? `<img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(exp.title)}" class="card-thumbnail" loading="lazy">`
            : '';

        const starTitle = exp.star_count > 0
            ? `Dibintangi oleh ${exp.starred_by_names}`
            : 'Jadilah yang pertama memberi star';
        const starHtml = config.isAuthenticated
            ? `<button type="button"
                       class="button button-star${exp.is_starred ? ' is-starred' : ''}"
                       data-action="star"
                       aria-pressed="${exp.is_starred}"
                       title="${escapeHtml(starTitle)}">
                   <span aria-hidden="true">★</span>
                   ${exp.is_starred ? 'Unstar' : 'Star'}
                   <span class="star-count">${Number(exp.star_count)}</span>
               </button>`
            : `<a href="${escapeHtml(config.urls.login)}"
                  class="button button-star"
                  title="Login untuk memberi star">
                   <span aria-hidden="true">★</span>
                   Star
                   <span class="star-count">${Number(exp.star_count)}</span>
               </a>`;

        const editHtml = config.canEdit
            ? `<a href="${escapeHtml(urlFor('edit', item.pk))}" class="button button-secondary">Edit</a>`
            : '';
        const deleteHtml = config.canDelete
            ? `<button type="button" class="button button-danger" data-action="delete">Hapus</button>`
            : '';

        article.innerHTML = `
            ${thumbnailHtml}
            <span class="card-category">${escapeHtml(exp.category_display)}</span>
            <h2>${escapeHtml(exp.title)}</h2>
            <p class="card-description">${escapeHtml(exp.description)}</p>
            <p class="card-status">${escapeHtml(formatStatus(exp))}</p>
            <div class="card-actions">
                ${starHtml}
                ${editHtml}
                ${deleteHtml}
            </div>
        `;
        // Disimpan sebagai data (bukan HTML) untuk dipakai modal hapus
        article.dataset.title = exp.title;
        return article;
    }

    function renderExperienceList(items, filters) {
        updateResultCount(items.length, filters);

        if (items.length === 0) {
            emptyMessage.textContent = filters.title || filters.category
                ? 'Tidak ada pengalaman yang cocok dengan pencarian.'
                : 'Belum ada pengalaman yang ditambahkan.';
            displayPageSection({ showEmpty: true });
            return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach(item => fragment.appendChild(buildExperienceCard(item)));
        gridContainer.replaceChildren(fragment);
        displayPageSection({ showGrid: true });
    }

    // Mengambil data dari endpoint JSON. Request sebelumnya dibatalkan agar
    // respons lama tidak menimpa hasil pencarian yang lebih baru.
    async function fetchExperiences(filters = currentFilters()) {
        if (listAbortController) listAbortController.abort();
        listAbortController = new AbortController();

        const params = new URLSearchParams();
        if (filters.title) params.set('title', filters.title);
        if (filters.category) params.set('category', filters.category);
        const query = params.toString();

        try {
            displayPageSection({ showLoading: true });
            resultCount.textContent = '';

            const response = await fetch(query ? `${config.urls.list}?${query}` : config.urls.list, {
                headers: { 'Accept': 'application/json' },
                signal: listAbortController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const items = await response.json();
            renderExperienceList(items, filters);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error loading experiences:', error);
            displayPageSection({ showError: true });
        }
    }

    // Sinkronkan filter ke URL agar hasil pencarian bisa di-refresh / dibagikan
    function syncFiltersToUrl(filters) {
        const url = new URL(window.location.href);
        ['title', 'category'].forEach(key => {
            if (filters[key]) url.searchParams.set(key, filters[key]);
            else url.searchParams.delete(key);
        });
        window.history.replaceState(null, '', url);
    }

    function runSearch() {
        clearTimeout(searchDebounceTimer);
        const filters = currentFilters();
        syncFiltersToUrl(filters);
        fetchExperiences(filters);
    }

    // Debouncing: request hanya dikirim setelah pengguna berhenti mengetik
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(runSearch, SEARCH_DEBOUNCE_DELAY);
    });
    categoryFilter.addEventListener('change', runSearch);
    searchForm.addEventListener('submit', event => {
        event.preventDefault();
        runSearch();
    });
    retryButton.addEventListener('click', () => fetchExperiences());

    // ---------- Star ----------
    async function toggleStar(card, button) {
        button.disabled = true;
        try {
            const response = await fetch(urlFor('star', card.dataset.id), {
                method: 'POST',
                headers: csrfHeaders(),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast('Gagal memberi star', formatServerErrors(result, response.status), 'error');
                return;
            }
            card.replaceWith(buildExperienceCard(result));
        } catch (error) {
            console.error('Error toggling star:', error);
            showToast('Gagal memberi star', 'Tidak dapat terhubung ke server.', 'error');
        } finally {
            button.disabled = false;
        }
    }

    // ---------- Hapus ----------
    function openDeleteModal(card) {
        pendingDeleteId = card.dataset.id;
        deleteName.textContent = card.dataset.title;
        deleteModal.showPopover();
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        deleteConfirmButton.disabled = true;

        try {
            const response = await fetch(urlFor('delete', pendingDeleteId), {
                method: 'POST',
                headers: csrfHeaders(),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast('Gagal menghapus pengalaman', formatServerErrors(result, response.status), 'error');
                return;
            }
            deleteModal.hidePopover();
            showToast('Berhasil', 'Pengalaman berhasil dihapus.', 'success');
            fetchExperiences();
        } catch (error) {
            console.error('Error deleting experience:', error);
            showToast('Gagal menghapus pengalaman', 'Tidak dapat terhubung ke server.', 'error');
        } finally {
            deleteConfirmButton.disabled = false;
        }
    }

    if (deleteModal && deleteConfirmButton) {
        deleteConfirmButton.addEventListener('click', confirmDelete);
        deleteModal.addEventListener('toggle', event => {
            if (event.newState === 'closed') pendingDeleteId = null;
        });
    }

    // Event delegation: satu listener untuk semua tombol di dalam card,
    // termasuk card yang dibuat ulang setelah fetch
    gridContainer.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const card = button.closest('article[data-id]');

        if (button.dataset.action === 'star') toggleStar(card, button);
        if (button.dataset.action === 'delete' && deleteModal) openDeleteModal(card);
    });

    // ---------- Tambah lewat modal ----------
    function clearFieldErrors() {
        experienceForm.querySelectorAll('[data-error-for]').forEach(el => {
            el.textContent = '';
            el.classList.add('hide');
        });
        experienceForm.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    }

    // Menampilkan pesan validasi dari server di bawah field masing-masing (pakai textContent)
    function showFieldErrors(errors) {
        Object.entries(errors).forEach(([field, fieldErrors]) => {
            const target = experienceForm.querySelector(`[data-error-for="${CSS.escape(field)}"]`);
            if (!target) return;
            target.textContent = fieldErrors.map(error => error.message).join(' ');
            target.classList.remove('hide');
            const input = experienceForm.elements[field];
            if (input) input.setAttribute('aria-invalid', 'true');
        });
    }

    async function addExperience(event) {
        event.preventDefault();
        clearFieldErrors();

        const submitButton = experienceForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const response = await fetch(config.urls.create, {
                method: 'POST',
                headers: csrfHeaders(),
                // FormData ikut membawa field csrfmiddlewaretoken dari {% csrf_token %}
                body: new FormData(experienceForm),
            });
            const result = await response.json().catch(() => ({}));

            if (response.status === 201) {
                experienceForm.reset();
                addModal.hidePopover();
                showToast('Berhasil', 'Pengalaman baru berhasil ditambahkan!', 'success');
                fetchExperiences();
                return;
            }

            if (result.errors) showFieldErrors(result.errors);
            showToast('Gagal menambahkan pengalaman', formatServerErrors(result, response.status), 'error');
        } catch (error) {
            console.error('Error adding experience:', error);
            showToast('Gagal menambahkan pengalaman', 'Tidak dapat terhubung ke server. Silakan coba lagi.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    if (experienceForm && addModal) {
        experienceForm.addEventListener('submit', addExperience);
        addModal.addEventListener('toggle', event => {
            if (event.newState === 'open') {
                clearFieldErrors();
                experienceForm.elements.title?.focus();
            }
        });
    }

    // Start: pakai filter dari URL (?title=&category=) bila ada
    const initialCategory = new URLSearchParams(window.location.search).get('category');
    if (initialCategory) categoryFilter.value = initialCategory;
    fetchExperiences();
})();
