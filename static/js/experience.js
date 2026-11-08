/**
 * Halaman Experience (Tugas 6): seluruh data dibaca dan diubah lewat API DRF
 * di /api/v1/experience/ tanpa reload halaman.
 *
 *   GET    /api/v1/experience/?title=&category=   daftar + pencarian
 *   POST   /api/v1/experience/                    tambah (superuser)
 *   PATCH  /api/v1/experience/<id>/               ubah (superuser & Editor)
 *   DELETE /api/v1/experience/<id>/               hapus (superuser) -> 204
 *   POST   /api/v1/experience/<id>/star/          star/unstar (akun login)
 *
 * Bergantung pada utils.js (escapeHtml, safeUrl, getCookie) dan toast.js (showToast)
 * yang dimuat oleh base.html.
 */
(function () {
    'use strict';

    const config = JSON.parse(document.getElementById('experience-config').textContent);
    const SEARCH_DEBOUNCE_DELAY = 300;
    const FORM_FIELDS = ['title', 'description', 'category', 'thumbnail', 'ended_at'];

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

    // Elemen sesuai peran: bisa null, jadi selalu dicek sebelum dipakai
    const addModal = document.getElementById('add-experience-modal');
    const addForm = document.getElementById('experience-form');
    const editModal = document.getElementById('edit-experience-modal');
    const editForm = document.getElementById('edit-experience-form');
    const deleteModal = document.getElementById('delete-experience-modal');
    const deleteName = document.getElementById('delete-experience-name');
    const deleteConfirmButton = document.getElementById('delete-experience-confirm');

    // Data terakhir dari API, dipakai untuk mengisi modal edit tanpa request tambahan
    const experiencesById = new Map();
    let listAbortController;
    let searchDebounceTimer;
    let pendingDeleteId = null;
    let pendingEditId = null;

    const dateFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' });

    function urlFor(name, experienceId) {
        return config.urls[name].replace(config.placeholderId, experienceId);
    }

    function currentFilters() {
        return { title: searchInput.value.trim(), category: categoryFilter.value };
    }

    // ---------- Komunikasi dengan API ----------

    /** Error API yang membawa status HTTP dan body (error per field dari serializer). */
    class ApiError extends Error {
        constructor(message, status, data) {
            super(message);
            this.status = status;
            this.data = data;
        }
    }

    /**
     * Mengubah body error DRF menjadi satu kalimat untuk toast.
     * 400: {"title": ["..."], ...}; 403/404/405: {"detail": "..."}.
     */
    function apiErrorMessage(data, status) {
        const messages = Object.values(data || {}).flat().filter(value => typeof value === 'string');
        if (messages.length) return messages.join(' ');
        if (status === 403) return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
        return `Permintaan gagal (HTTP ${status}).`;
    }

    /** Satu tempat untuk POST/PATCH/DELETE: body JSON, header X-CSRFToken, dan error. */
    async function sendWrite(url, method, payload) {
        const response = await fetch(url, {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: payload === undefined ? undefined : JSON.stringify(payload),
        });
        if (response.status === 204) return null; // DELETE: body kosong
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new ApiError(apiErrorMessage(data, response.status), response.status, data);
        return data;
    }

    /** Pesan toast untuk error jaringan vs error dari API. */
    function errorText(error) {
        return error instanceof ApiError ? error.message : 'Tidak dapat terhubung ke server.';
    }

    // ---------- Render daftar ----------

    function displayPageSection({ showLoading = false, showError = false, showEmpty = false, showGrid = false }) {
        loadingState.classList.toggle('hide', !showLoading);
        errorState.classList.toggle('hide', !showError);
        emptyState.classList.toggle('hide', !showEmpty);
        gridContainer.classList.toggle('hide', !showGrid);
        gridContainer.setAttribute('aria-busy', String(showLoading));
    }

    function updateResultCount(count, filters) {
        const isFiltered = filters.title || filters.category;
        resultCount.textContent = isFiltered && count > 0 ? `Menemukan ${count} pengalaman.` : '';
    }

    // started_at diisi otomatis saat data dibuat (auto_now_add), bukan tanggal mulai
    // pengalaman sebenarnya, jadi yang ditampilkan hanya status dan tanggal selesai.
    function formatStatus(exp) {
        if (exp.is_ongoing) return 'Sedang berlangsung';
        return `Selesai · ${dateFormatter.format(new Date(exp.ended_at))}`;
    }

    // Setiap teks dari API melewati escapeHtml dan setiap URL melewati safeUrl
    // sebelum disisipkan ke innerHTML (perlindungan XSS).
    function buildExperienceCard(exp) {
        experiencesById.set(exp.id, exp);

        const article = document.createElement('article');
        article.className = 'content-card';
        article.dataset.id = exp.id;

        const thumbnailUrl = exp.thumbnail ? safeUrl(exp.thumbnail) : '';
        const thumbnailHtml = thumbnailUrl
            ? `<img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(exp.title)}" class="card-thumbnail" loading="lazy">`
            : '';

        const starCount = Number(exp.star_count);
        const starTitle = starCount > 0
            ? `Dibintangi oleh ${exp.starred_by_names}`
            : 'Jadilah yang pertama memberi star';
        const starHtml = config.isAuthenticated
            ? `<button type="button"
                       class="button button-star${exp.is_starred ? ' is-starred' : ''}"
                       data-action="star"
                       aria-pressed="${Boolean(exp.is_starred)}"
                       title="${escapeHtml(starTitle)}">
                   <span aria-hidden="true">★</span>
                   ${exp.is_starred ? 'Unstar' : 'Star'}
                   <span class="star-count">${starCount}</span>
               </button>`
            : `<a href="${escapeHtml(config.urls.login)}" class="button button-star" title="Login untuk memberi star">
                   <span aria-hidden="true">★</span>
                   Star
                   <span class="star-count">${starCount}</span>
               </a>`;

        const editHtml = config.canEdit && editModal
            ? '<button type="button" class="button button-secondary" data-action="edit">Edit</button>'
            : '';
        const deleteHtml = config.canDelete && deleteModal
            ? '<button type="button" class="button button-danger" data-action="delete">Hapus</button>'
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
        return article;
    }

    function renderExperienceList(items, filters) {
        updateResultCount(items.length, filters);
        experiencesById.clear();

        if (items.length === 0) {
            emptyMessage.textContent = filters.title || filters.category
                ? 'Tidak ada pengalaman yang cocok dengan pencarian.'
                : 'Belum ada pengalaman yang ditambahkan.';
            gridContainer.replaceChildren();
            displayPageSection({ showEmpty: true });
            return;
        }

        gridContainer.replaceChildren(...items.map(buildExperienceCard));
        displayPageSection({ showGrid: true });
    }

    // Request sebelumnya dibatalkan agar respons lama tidak menimpa hasil pencarian terbaru
    async function fetchExperiences(filters = currentFilters()) {
        if (listAbortController) listAbortController.abort();
        listAbortController = new AbortController();

        const url = new URL(config.urls.list, window.location.origin);
        if (filters.title) url.searchParams.set('title', filters.title);
        if (filters.category) url.searchParams.set('category', filters.category);

        try {
            displayPageSection({ showLoading: true });
            resultCount.textContent = '';

            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: listAbortController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            renderExperienceList(await response.json(), filters);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error loading experiences:', error);
            displayPageSection({ showError: true });
        }
    }

    // ---------- Pencarian ----------

    // Filter disimpan di URL halaman agar hasil pencarian bisa di-refresh / dibagikan
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

    // ---------- Helper form (tambah & edit) ----------

    /** Mengambil field model saja sebagai JSON; nilai kosong opsional dikirim sebagai null. */
    function formPayload(form) {
        const data = new FormData(form);
        const payload = Object.fromEntries(FORM_FIELDS.map(name => [name, data.get(name) ?? '']));
        if (!payload.thumbnail) payload.thumbnail = null;
        if (!payload.ended_at) payload.ended_at = null;
        return payload;
    }

    function clearFieldErrors(form) {
        form.querySelectorAll('[data-error-for]').forEach(el => {
            el.textContent = '';
            el.classList.add('hide');
        });
        form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    }

    // Error 400 dari serializer: {"field": ["pesan", ...]} -> tampil di bawah field (textContent)
    function showFieldErrors(form, errors) {
        Object.entries(errors || {}).forEach(([field, messages]) => {
            const target = form.querySelector(`[data-error-for="${CSS.escape(field)}"]`);
            if (!target || !Array.isArray(messages)) return;
            target.textContent = messages.join(' ');
            target.classList.remove('hide');
            form.elements[field]?.setAttribute('aria-invalid', 'true');
        });
    }

    /** Menjalankan submit form ke API, menampilkan error per field + toast. */
    async function submitForm(form, { url, method, successMessage, failTitle, onSuccess }) {
        clearFieldErrors(form);
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            await sendWrite(url, method, formPayload(form));
            onSuccess();
            showToast('Berhasil', successMessage, 'success');
            fetchExperiences();
        } catch (error) {
            if (error instanceof ApiError && error.status === 400) showFieldErrors(form, error.data);
            showToast(failTitle, errorText(error), 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    // ---------- Tambah (superuser) ----------

    if (addForm && addModal) {
        addForm.addEventListener('submit', event => {
            event.preventDefault();
            submitForm(addForm, {
                url: config.urls.list,
                method: 'POST',
                successMessage: 'Pengalaman baru berhasil ditambahkan!',
                failTitle: 'Gagal menambahkan pengalaman',
                onSuccess: () => {
                    addForm.reset();
                    addModal.hidePopover();
                },
            });
        });
        addModal.addEventListener('toggle', event => {
            if (event.newState === 'open') {
                clearFieldErrors(addForm);
                addForm.elements.title?.focus();
            }
        });
    }

    // ---------- Edit lewat PATCH (superuser & Editor) ----------

    function openEditModal(experienceId) {
        const exp = experiencesById.get(experienceId);
        if (!exp || !editModal) return;

        pendingEditId = experienceId;
        clearFieldErrors(editForm);
        editForm.elements.title.value = exp.title;
        editForm.elements.description.value = exp.description;
        editForm.elements.category.value = exp.category;
        editForm.elements.thumbnail.value = exp.thumbnail || '';
        // API mengirim ISO 8601 (mis. 2025-03-01T10:00:00Z); input datetime-local butuh YYYY-MM-DDTHH:MM
        editForm.elements.ended_at.value = exp.ended_at ? exp.ended_at.slice(0, 16) : '';
        editModal.showPopover();
        editForm.elements.title.focus();
    }

    if (editForm && editModal) {
        editForm.addEventListener('submit', event => {
            event.preventDefault();
            if (!pendingEditId) return;
            submitForm(editForm, {
                url: urlFor('detail', pendingEditId),
                method: 'PATCH',
                successMessage: 'Pengalaman berhasil diperbarui!',
                failTitle: 'Gagal memperbarui pengalaman',
                onSuccess: () => editModal.hidePopover(),
            });
        });
        editModal.addEventListener('toggle', event => {
            if (event.newState === 'closed') pendingEditId = null;
        });
    }

    // ---------- Star (akun login) ----------

    async function toggleStar(card, button) {
        button.disabled = true;
        try {
            const updated = await sendWrite(urlFor('star', card.dataset.id), 'POST');
            card.replaceWith(buildExperienceCard(updated));
        } catch (error) {
            showToast('Gagal memberi star', errorText(error), 'error');
            button.disabled = false;
        }
    }

    // ---------- Hapus (superuser) ----------

    function openDeleteModal(experienceId) {
        const exp = experiencesById.get(experienceId);
        if (!exp || !deleteModal) return;
        pendingDeleteId = experienceId;
        deleteName.textContent = exp.title;
        deleteModal.showPopover();
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;
        deleteConfirmButton.disabled = true;
        try {
            await sendWrite(urlFor('detail', pendingDeleteId), 'DELETE');
            deleteModal.hidePopover();
            showToast('Berhasil', 'Pengalaman berhasil dihapus.', 'success');
            fetchExperiences();
        } catch (error) {
            showToast('Gagal menghapus pengalaman', errorText(error), 'error');
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

    // Event delegation: satu listener untuk semua tombol card, termasuk card yang dirender ulang
    gridContainer.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) return;
        const card = button.closest('article[data-id]');
        const action = button.dataset.action;

        if (action === 'star') toggleStar(card, button);
        if (action === 'edit') openEditModal(card.dataset.id);
        if (action === 'delete') openDeleteModal(card.dataset.id);
    });

    // Start: pakai filter dari URL (?title=&category=) bila ada
    const initialCategory = new URLSearchParams(window.location.search).get('category');
    if (initialCategory) categoryFilter.value = initialCategory;
    fetchExperiences();
})();
