Nama : Kesya Clara Dania
NPM : 2506656892
Kelas : PBP C
Update untuk latihan branching

## Tentang Proyek

Website portofolio pribadi berbasis **Django 5.2** yang berisi halaman **Profile**, **Experience**, dan **Projects**. Pengunjung dapat membaca seluruh data tanpa login; akun yang sudah login dapat memberi *star*; peran **Editor** dapat mengubah Experience; dan **superuser** (pemilik portofolio) dapat menambah dan menghapus data.

## Menjalankan Secara Lokal

```bash
git clone https://github.com/kesyaaclaraa/myportofolio.git
cd myportofolio
python -m venv env
source env/bin/activate        # Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # akun pemilik portofolio
python manage.py runserver
```

Buka `http://127.0.0.1:8000/`. Untuk peran Editor, buat grup bernama `Editor` di Django Admin (`/admin/`) lalu masukkan akun ke grup tersebut. Jalankan seluruh test dengan `python manage.py test main`.

## Progres Mingguan

| Minggu | Fitur |
| --- | --- |
| Tugas 1 | Halaman profil statis dengan HTML5 semantik dan CSS responsif |
| Tugas 2 | Model `Experience` dan `Project`, halaman dinamis dengan routing, unit test |
| Tugas 3 | `base.html`, form `ModelForm` untuk CRUD Experience, endpoint JSON |
| Tugas 4 | Register/login/logout, cookie `last_login`, peran superuser & Editor, fitur *star* |
| Tugas 5 | Halaman Experience dimuat lewat AJAX, pencarian dengan *debouncing*, modal tambah data, toast, perlindungan XSS |

### Detail Tugas 5 (Experience)

| Fitur | Lokasi |
| --- | --- |
| Endpoint JSON manual (`JsonResponse`) berisi `star_count`, `is_starred`, `starred_by_names`; filter `?title=` dan `?category=` | `get_experience_json` di `main/views.py`, `GET /api/experience/` |
| Halaman hanya merender kerangka + state *loading* / kosong / *error* (dengan tombol "Coba Lagi") | `templates/experience.html` |
| Pencarian judul dengan *debouncing* 300 ms + filter kategori; request lama dibatalkan dengan `AbortController` | `static/js/experience.js` |
| Form tambah di dalam modal (Popover API), dikirim dengan `fetch()` + `FormData` + header `X-CSRFToken` | `templates/components/experience_form_modal.html`, `create_experience_ajax` |
| Status HTTP: `201` berhasil, `400` validasi gagal (pesan error per field), `403` bukan superuser, `405` bukan POST | `create_experience_ajax` |
| Toast sukses/gagal, termasuk pesan validasi dari server | `static/js/toast.js`, `formatServerErrors` di `static/js/utils.js` |
| `escapeHtml` untuk setiap teks dan `safeUrl` untuk setiap URL yang disisipkan lewat JavaScript | `static/js/utils.js` |
| `strip_tags` di `clean_title` dan `clean_description` | `ExperienceForm` di `main/forms.py` |
| Fitur ekstra: *star*/unstar dan hapus (dengan modal konfirmasi) tanpa reload, error validasi tampil di bawah field, jumlah hasil pencarian, filter tersimpan di URL | `toggle_star_experience_ajax`, `delete_experience_ajax`, `static/js/experience.js` |

###  Tugas 1

#### 1. Penggunaan Elemen Semantik HTML5
Ya, saya menggunakan elemen-elemen semantik HTML5 seperti `<header>`, `<nav>`, `<main>`, `<section>`, dan `<footer>` dalam merancang struktur HTML website portofolio ini.

Elemen semantik ini sangat membantu dalam pembuatan *static web* karena:
* **Struktur Kode Lebih Terorganisasi**: Membagi halaman web ke dalam blok-blok fungsi yang jelas (misalnya `<nav>` untuk navigasi dan `<main>` untuk konten utama), sehingga kode menjadi lebih rapi, terstruktur, dan mudah dipahami saat pemeliharaan (*maintenance*).
* **Aksesibilitas (Accessibility)**: Pembaca layar (*screen reader*) dapat dengan mudah mengenali tata letak halaman dan menavigasi bagian-bagian penting, memberikan pengalaman yang lebih inklusif bagi pengguna penyandang disabilitas.
* **SEO (Search Engine Optimization)**: Mesin pencari dapat mengenali hierarki dan konteks informasi pada web dengan lebih efektif dibanding jika hanya menggunakan tag generik seperti `<div>`.

---

#### 2. Tantangan Responsivitas CSS & Evaluasi Tampilan Mobile
Saat mengatur CSS agar responsif, tantangan tata letak utama yang ditemukan meliputi:
* **Penyesuaian Layout Grid & Flexbox**: Mengubah tata letak multi-kolom di layar komputer (seperti pada *Hero Section* dan kartu pengalaman) menjadi satu kolom (*single column*) yang rapi di layar ponsel tanpa merusak proporsi gambar dan *spacing*.
* **Proporsi Foto & Media**: Memastikan gambar profil dan gambar galeri kegiatan tetap tampil proporsional menggunakan properti `object-fit: cover` agar tidak terdistorsi atau memakan terlalu banyak ruang vertikal di layar ponsel.

**Evaluasi Pemilihan & Prioritas Elemen:**
* **Prioritas Hirarki Informasi**: Pada tampilan *mobile*, informasi paling penting (nama, peran, dan ringkasan profil) diprioritaskan untuk tampil lebih dahulu di atas agar pengguna langsung mendapatkan konteks utama sebelum melihat foto.
* **Perubahan Posisi & Tata Letak**: Menggunakan Media Queries (`@media (max-width: 768px)`) untuk mereset grid 2-kolom pada kartu *Hero* menjadi tumpukan vertikal, serta menyesuaikan margin dan padding agar ruang layar yang terbatas pada perangkat seluler dimaksimalkan dengan baik.

---

#### 3. Batasan Static Web & Rencana Fungsionalitas Dinamis
Sebagai *static web* murni, terdapat beberapa batasan yang dirasakan saat menyajikan informasi portofolio secara optimal:
* **Pengelolaan Konten Manual**: Setiap kali ingin menambahkan pengalaman baru, memperbarui keterampilan, atau mengubah teks, saya harus menyunting kode HTML secara manual.
* **Kurangnya Interaktivitas Real-Time**: Website belum dapat menyimpan atau memproses data dari pengguna, seperti menerima pesan melalui formulir kontak atau menyaring (*filter*) pengalaman berdasarkan kategori secara dinamis.

**Rencana Fungsionalitas Dinamis untuk Iterasi Selanjutnya:**
1. **Integrasi Database / Django Models**: Menggunakan *backend* Django dan basis data agar data pengalaman, pendidikan, dan *skills* dapat dikelola (tambah, edit, hapus) secara dinamis melalui Django Admin tanpa mengubah file HTML.
2. **Formulir Kontak Interaktif**: Menambahkan fitur formulir kontak yang terhubung dengan basis data atau layanan email untuk menerima masukan/pesan dari pengunjung secara *real-time*.
3. **Pencarian & Filtering Dinamis**: Menyediakan fitur *filter* kategori pengalaman (misal: Organisasi, Kepanitiaan, Prestasi) menggunakan JavaScript/Django agar pengunjung dapat mencari informasi dengan lebih cepat.

---

### Deklarasi Penggunaan AI

**Pernyataan Penggunaan AI:** Dalam pengerjaan tugas ini, saya menggunakan bantuan alat kecerdasan buatan (AI) sebagai pendamping belajar serta penyusunan ide.

**Refleksi Pemecahan Masalah:**
Meskipun memanfaatkan AI untuk berdiskusi, memahami sintaks CSS/HTML, dan mempercepat penyusunan ide, proses pemecahan masalah utama tetap dilakukan secara aktif. Saya mempelajari bagaimana struktur CSS Flexbox/Grid bekerja, mencoba secara mandiri implementasi responsivitas tata letak di layar ponsel, serta melakukan penyesuaian visual (*styling*) dan *debugging* agar tampilan akhir web portofolio sesuai dengan preferensi desain yang saya inginkan.

---

### Tugas 2

#### 1. Alur permintaan dari browser hingga data tampil di halaman Projects

Ketika pengguna membuka `/projects/`, browser mengirim permintaan HTTP GET ke server Django. Alurnya:

1. **`portofolio/urls.py`** (URL config level proyek) menerima permintaan tersebut. Karena semua path (`""`) diteruskan lewat `include("main.urls")`, sisa path (`projects/`) diserahkan ke konfigurasi URL milik aplikasi `main`.
2. **`main/urls.py`** (URL config level aplikasi) mencocokkan path `projects/` dengan pola `path("projects/", show_projects, name="show_projects")`, lalu memanggil fungsi *view* `show_projects`.
3. **View** (`main/views.py`) menjalankan `Project.objects.all()` untuk mengambil seluruh baris tabel `Project` dari database lewat Django ORM, memasukkannya ke dalam `context` (dict) bersama data statis seperti `name`, lalu memanggil `render(request, "projects.html", context)`.
4. **Model** (`main/models.py`) adalah lapisan yang menerjemahkan baris tabel database menjadi objek Python (`Project`) yang bisa diakses atributnya (`title`, `description`, `category`, `link`) langsung dari template.
5. **Template** (`templates/projects.html`) menerima `context`, lalu Django Template Engine merender HTML dengan mengganti `{% for project in project_list %}` menjadi perulangan kartu HTML untuk tiap objek `Project`, dan `{{ project.title }}`, `{{ project.get_category_display }}`, dsb. dengan nilai sebenarnya.
6. HTML hasil render dikirim kembali sebagai response ke browser, yang kemudian menampilkannya ke pengguna.

Singkatnya: **Browser → urls.py proyek → urls.py aplikasi → View → Model (ambil data) → View (susun context) → Template (render HTML) → Browser**.

#### 2. Mengapa data disimpan di model, bukan ditulis langsung di template?

Menyimpan data di model (dan database) alih-alih menulis langsung (*hard-code*) di HTML memberi beberapa keuntungan:

* **Pemisahan tanggung jawab (separation of concerns):** Template hanya mengurus *bagaimana* data ditampilkan, sedangkan model mengurus *data apa* yang ada. Perubahan pada satu proyek (misalnya menambah proyek baru) tidak memerlukan perubahan kode HTML sama sekali.
* **Kemudahan pemeliharaan:** Menambah, mengubah, atau menghapus data proyek cukup dilakukan lewat Django Admin atau shell, tanpa perlu membuka dan mengedit file template secara manual — jauh lebih cepat dan minim risiko salah ketik/merusak struktur HTML.
* **Konsistensi tampilan:** Karena semua kartu proyek dirender dari satu template yang sama menggunakan perulangan (`{% for %}`), tampilan setiap kartu otomatis konsisten. Kalau data ditulis manual di HTML, ada risiko format antar-kartu berbeda-beda.
* **Skalabilitas:** Jumlah data tidak dibatasi oleh seberapa banyak yang ditulis di HTML. Menambah 100 proyek sama mudahnya dengan menambah 1 proyek, karena hanya menambah baris data, bukan menulis blok HTML baru.
* **Membuka pintu ke fitur lanjutan:** Dengan data di database, fitur seperti pencarian, filter kategori, atau CRUD lewat form menjadi mungkin — sesuatu yang mustahil dilakukan kalau data hanya berupa teks statis di HTML.

#### 3. Perbedaan `makemigrations` dan `migrate`

* **`makemigrations`** membaca perubahan pada model (`models.py`) dan **membuat berkas migrasi baru** (file Python di folder `migrations/`) yang berisi instruksi terstruktur tentang perubahan skema tersebut (misalnya "buat tabel baru", "tambah kolom X"). Perintah ini **tidak menyentuh database** — hanya menghasilkan rencana perubahan dalam bentuk kode.
* **`migrate`** **menerapkan** migrasi yang sudah dibuat (baik yang baru maupun yang belum diterapkan) ke database sungguhan, dengan menjalankan perintah SQL yang sesuai (`CREATE TABLE`, `ALTER TABLE`, dst.) sehingga skema database benar-benar berubah mengikuti model.

Contoh nyata dari tugas ini: saat saya menambahkan model baru `Project` di `main/models.py` (dengan field `title`, `description`, `category`, `link`), saya harus menjalankan:

```bash
python manage.py makemigrations main   # menghasilkan main/migrations/0002_project.py
python manage.py migrate                # membuat tabel main_project di database
```

Tanpa `makemigrations`, Django tidak tahu ada perubahan model yang perlu direkam. Tanpa `migrate`, tabel `main_project` tidak akan pernah terbentuk di database meskipun modelnya sudah ada di kode, sehingga `Project.objects.all()` di view akan gagal dengan error karena tabelnya belum ada.

---

### Tugas 3

1. Kita menggunakan `ModelForm` alih-alih menulis form HTML manual karena `ModelForm` otomatis menurunkan field form (beserta tipe input dan validasinya, misalnya `URLField` menjadi validasi URL) langsung dari definisi model (`main/models.py`), sehingga tidak perlu menulis ulang daftar field, aturan validasi, maupun query penyimpanan data secara manual. Ini juga menjaga *single source of truth*: kalau field pada model berubah, form ikut menyesuaikan tanpa perlu disunting satu per satu, sekaligus mengurangi risiko *human error* seperti lupa memvalidasi input tertentu. Sedangkan `{% csrf_token %}` wajib ditambahkan karena Django menerapkan proteksi *Cross-Site Request Forgery* untuk setiap request yang mengubah data (POST). Token ini unik per sesi/pengguna dan diverifikasi oleh server saat form dikirim; tanpa token tersebut, Django akan menolak request dengan error 403 Forbidden karena tidak bisa memastikan bahwa request benar-benar berasal dari form yang dirender aplikasi sendiri, bukan dari situs pihak ketiga yang mencoba mengirim request atas nama pengguna yang sedang login (serangan CSRF).

2. JSON lebih disukai dibandingkan XML dalam pengembangan aplikasi web modern karena beberapa alasan: **sintaksnya lebih ringkas** (tidak perlu closing tag seperti XML), sehingga ukuran payload lebih kecil dan lebih cepat dikirim lewat jaringan; **strukturnya memetakan langsung ke tipe data pada bahasa pemrograman** seperti objek, array, string, angka, dan boolean, sehingga di JavaScript (dan bahasa lain) JSON bisa langsung diubah menjadi objek native tanpa parsing tambahan yang rumit (`JSON.parse()` vs. DOM parser XML yang lebih berat); serta **lebih mudah dibaca manusia** dan didukung secara native oleh hampir semua bahasa pemrograman dan framework modern, termasuk Django (`django.core.serializers`) dan browser (`fetch().json()`). XML masih dipakai di beberapa kasus lama (misalnya SOAP, konfigurasi tertentu), tetapi untuk pertukaran data API web modern JSON jauh lebih efisien dan sederhana.

3. Ketika fungsi *view* seperti `get_experience_json` (atau `get_projects_json`) dipanggil, alurnya adalah: 
(1) *view* mengambil data dari database melalui Django ORM (`Experience.objects.all()`), yang hasilnya berupa QuerySet berisi objek-objek model Python; 
(2) objek model tersebut **tidak bisa langsung dikembalikan** sebagai response HTTP karena bukan format teks yang dipahami klien, sehingga perlu melalui proses **serialization**, yaitu `serializers.serialize("json", queryset)`, yang mengubah setiap objek model beserta field-fieldnya menjadi struktur data JSON (teks); 
(3) hasil JSON tersebut dibungkus dalam `HttpResponse` dengan `content_type="application/json"` dan dikirim ke klien; 
(4) di sisi lain, saat halaman seperti `show_experience` ingin menampilkan data yang sama, ia memanggil endpoint JSON tersebut lalu melakukan **deserialization** (`serializers.deserialize("json", ...)`) untuk mengubah teks JSON itu kembali menjadi objek model Python yang bisa diakses atributnya (`experience.title`, `experience.is_ongoing`, dst.) di template. Proses serialization diperlukan karena objek model Django menyimpan referensi ke koneksi database dan metode-metode Python yang tidak bisa dikirim lewat jaringan sebagai teks; serialization menjembatani representasi internal (objek Python) dengan representasi eksternal yang portabel dan universal (teks JSON) agar data bisa dipertukarkan antar sistem, disimpan, atau dikonsumsi oleh klien mana pun (browser, aplikasi mobile, dsb.) tanpa bergantung pada implementasi internal Django.

---

### Tugas 5

1. ***Debouncing*** adalah teknik menunda eksekusi sebuah fungsi sampai suatu *event* berhenti terjadi selama jeda waktu tertentu. Pada fitur pencarian, setiap ketikan memicu *event* `input`; tanpa *debouncing*, mengetik "asisten" akan mengirim 7 request AJAX (`a`, `as`, `asi`, ...) padahal hanya hasil terakhir yang dibutuhkan. Dengan *debouncing*, setiap ketikan me-*reset* timer (`clearTimeout` lalu `setTimeout`), sehingga request baru dikirim setelah pengguna berhenti mengetik selama 300 ms. Ini penting karena (a) mengurangi beban server dan query database yang sia-sia, (b) menghemat kuota jaringan pengguna, dan (c) mencegah *race condition*, yaitu respons request lama yang datang terlambat menimpa hasil pencarian yang lebih baru. Di halaman Experience, kasus (c) juga dicegah dengan `AbortController` yang membatalkan request sebelumnya setiap kali request baru dikirim.

2. `fetch()` bersifat asinkron: ia langsung mengembalikan sebuah **Promise**, bukan data, karena respons dari server baru tiba beberapa saat kemudian. `await` membuat fungsi `async` "menunggu" Promise tersebut selesai (*resolved*) lalu mengambil nilainya, tanpa memblokir *thread* utama browser sehingga halaman tetap responsif. Pada kode kita, `await` dipakai dua kali: `const response = await fetch(url)` untuk menunggu header respons (status 200/400/403 dapat dicek lewat `response.ok`/`response.status`), lalu `await response.json()` untuk menunggu *body* selesai diunduh dan di-*parse*. Jika `await` tidak dipakai, variabel `response` berisi objek Promise yang masih *pending*, sehingga `response.ok` bernilai `undefined` dan `response.json` bukan fungsi (TypeError). Kode setelahnya pun akan berjalan duluan sebelum data datang, misalnya menampilkan state "kosong" padahal data belum dimuat. Selain itu, error jaringan tidak akan tertangkap oleh blok `try...catch`, karena *rejection* Promise baru terjadi setelah blok tersebut selesai dieksekusi.

3. **XSS (*Cross-Site Scripting*)** adalah serangan di mana penyerang menyisipkan kode (biasanya JavaScript) ke dalam data yang kemudian ditampilkan di halaman milik pengguna lain, sehingga kode tersebut berjalan dengan hak akses situs kita. Contohnya, judul `<img src="x" onerror="alert('XSS!')">` yang dirender sebagai HTML akan menjalankan `onerror`. Penyerang dapat memakainya untuk mencuri cookie/sesi, melakukan aksi atas nama korban, atau mengubah tampilan halaman. Template Django **otomatis meng-*escape*** setiap `{{ variabel }}` (mengubah `<` menjadi `&lt;`, dst.), sehingga data tampil sebagai teks biasa kecuali developer sengaja mematikannya dengan `|safe`. Sebaliknya, saat data dari AJAX disisipkan lewat JavaScript, **tidak ada *auto-escaping***: properti seperti `innerHTML` dan *template literal* akan mem-*parse* string apa adanya sebagai HTML. Karena itu tanggung jawab *escaping* sepenuhnya ada pada developer, dan cukup satu field yang lupa di-*escape* untuk membuka celah. Di proyek ini, pertahanannya dibuat berlapis: (a) di server, `strip_tags` pada `clean_title`/`clean_description` membuang tag HTML sebelum data disimpan, dan input yang isinya hanya tag akan ditolak dengan status 400; (b) di klien, setiap teks melewati `escapeHtml` (atau `textContent`) sebelum masuk ke HTML; dan (c) setiap URL (thumbnail, link) melewati `safeUrl` karena skema `javascript:` tetap berbahaya walaupun karakternya sudah di-*escape*.

#### Pengujian Tugas 5

* `python manage.py test main`: 22 test lulus, termasuk status 201/400/403/405, penolakan request tanpa token CSRF, *star* (401 untuk pengunjung anonim), hapus, dan payload XSS `<img src="x" onerror="alert('XSS!')">` (ditolak dengan 400 jika isinya hanya tag; tag dibuang jika bercampur teks).
* Smoke test dengan `runserver`: `/`, `/experience/`, `/projects/`, `/api/experience/`, dan file statis JS mengembalikan 200; POST tanpa login mendapat 403 (tambah) dan 401 (*star*).

#### Deklarasi Penggunaan AI (Tugas 5)

* **Tools:** Claude Code (model Claude Opus 5.5) di VS Code, dengan akses ke repositori, terminal, dan *test runner*.
* **Strategi prompting:** Saya memberikan PDF soal Tugas 5 beserta rubriknya, lalu meminta AI melanjutkan kode Tutorial 5 dan menerapkan polanya pada bagian Experience. AI diminta membaca kode yang sudah ada terlebih dahulu (`views.py`, `forms.py`, `projects.html`, `toast.js`, CSS) agar mengikuti pola dan gaya penamaan yang sama, lalu mengerjakannya bertahap di branch `feat/tugas-5-experience-ajax` dengan satu *commit* per langkah (*conventional commits*).
* **Prompt yang digunakan:**
  > Lanjutkan tutorial kmrn dengan mengerjakan tugas tugas ini dengan menyelesaikan seluruh rubik penilaiannya *(dengan lampiran PDF soal Tugas 5)*
* **Bagian yang dibantu AI:** pemindahan `escapeHtml`/`getCookie` ke `static/js/utils.js`; `serialize_experience`, `get_experience_json`, `create_experience_ajax`, `toggle_star_experience_ajax`, dan `delete_experience_ajax`; `clean_title`/`clean_description`; `templates/experience.html`, modal form, dan `static/js/experience.js`; CSS tambahan; test di `main/tests.py`; serta draf jawaban reflektif di atas.
* **Analisis kritis dan koreksi selama pengerjaan:**
  * Penggantian teks otomatis yang dilakukan AI pada `main/urls.py` ikut mengubah baris di dalam `path(...)` dan membuat `manage.py check` gagal (`kwargs argument must be a dict`). Kesalahan ini tertangkap karena setiap langkah langsung diverifikasi dengan `check`/test, bukan diasumsikan benar.
  * Versi awal kartu menampilkan rentang `started_at – ended_at`. Saat data asli dicek lewat `/api/experience/`, muncul rentang "Sep 2026 – Mar 2025" karena `started_at` memakai `auto_now_add` (tanggal data dibuat, bukan tanggal mulai pengalaman). Tampilannya lalu diubah menjadi status + tanggal selesai saja. Kesalahan semantik seperti ini tidak terdeteksi oleh test; harus dicek dengan data nyata.
  * Pengguna non-superuser tidak mendapat `{% csrf_token %}` di halaman, sehingga cookie `csrftoken` bisa tidak ada saat mereka menekan *star*. Ini ditangani dengan `@ensure_csrf_cookie` pada `show_experience` dan dibuktikan dengan test.
  * Dua test Projects sudah gagal sejak Tutorial 5 (halaman Projects berpindah ke AJAX) tanpa disadari. Test tersebut diperbarui agar memeriksa endpoint JSON.
  * **Keterbatasan:** lingkungan AI tidak memiliki Node.js atau browser *headless*, sehingga JavaScript tidak bisa dieksekusi otomatis. Interaksi di browser (modal, toast, *debouncing*, *star*, hapus, dan uji `alert` XSS) harus diuji manual di browser untuk peran anonim, user biasa, Editor, dan superuser. AI hanya bisa memverifikasi sisi server (test dan respons HTTP).
