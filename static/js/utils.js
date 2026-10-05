/**
 * Helper bersama untuk halaman yang memuat data lewat AJAX
 * (dipakai oleh projects.html dan experience.html).
 */

/**
 * Mengubah karakter khusus HTML menjadi entity agar ditampilkan sebagai teks,
 * bukan dieksekusi sebagai markup/script (perlindungan XSS sisi klien).
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * Hanya meloloskan URL http(s). Skema lain seperti `javascript:` atau `data:`
 * tetap bisa menjalankan script walaupun sudah di-escape, jadi dikosongkan.
 */
function safeUrl(value) {
    try {
        const url = new URL(value, window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

/**
 * Membaca nilai cookie, digunakan untuk mengambil token CSRF (`csrftoken`).
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Mengubah respons error dari server menjadi satu kalimat untuk toast.
 * Mendukung format `{"errors": form.errors.get_json_data()}` dan `{"message": "..."}`.
 */
function formatServerErrors(result, status) {
    if (result && result.errors) {
        return Object.values(result.errors).flat().map(error => error.message).join(' ');
    }
    return (result && result.message) || `Terjadi kesalahan (status ${status}).`;
}
