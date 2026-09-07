Nama : Kesya Clara
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