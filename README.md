Nama : Kesya Clara Dania
NPM : 2506656892
Kelas : PBP C
Update untuk latihan branching

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

3. Ketika fungsi *view* seperti `get_experience_json` (atau `get_projects_json`) dipanggil, alurnya adalah: (1) *view* mengambil data dari database melalui Django ORM (`Experience.objects.all()`), yang hasilnya berupa QuerySet berisi objek-objek model Python; (2) objek model tersebut **tidak bisa langsung dikembalikan** sebagai response HTTP karena bukan format teks yang dipahami klien, sehingga perlu melalui proses **serialization**, yaitu `serializers.serialize("json", queryset)`, yang mengubah setiap objek model beserta field-fieldnya menjadi struktur data JSON (teks); (3) hasil JSON tersebut dibungkus dalam `HttpResponse` dengan `content_type="application/json"` dan dikirim ke klien; (4) di sisi lain, saat halaman seperti `show_experience` ingin menampilkan data yang sama, ia memanggil endpoint JSON tersebut lalu melakukan **deserialization** (`serializers.deserialize("json", ...)`) untuk mengubah teks JSON itu kembali menjadi objek model Python yang bisa diakses atributnya (`experience.title`, `experience.is_ongoing`, dst.) di template. Proses serialization diperlukan karena objek model Django menyimpan referensi ke koneksi database dan metode-metode Python yang tidak bisa dikirim lewat jaringan sebagai teks; serialization menjembatani representasi internal (objek Python) dengan representasi eksternal yang portabel dan universal (teks JSON) agar data bisa dipertukarkan antar sistem, disimpan, atau dikonsumsi oleh klien mana pun (browser, aplikasi mobile, dsb.) tanpa bergantung pada implementasi internal Django.