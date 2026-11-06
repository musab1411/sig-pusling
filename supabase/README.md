# Setup Database Fitur Permohonan Kunjungan

Fitur **Permohonan Kunjungan** dan **Kalender Aktivitas** memakai tabel dan view
Supabase berikut:

- `permohonan_kunjungan` — menyimpan semua permohonan (termasuk data kontak).
- `permohonan_terjadwal` — view publik yang hanya berisi permohonan berstatus
  `disetujui`, tanpa nomor HP/email.

## Langkah Menjalankan

1. Buka project Supabase, lalu masuk ke **SQL Editor**.
2. Buka file `supabase/migrations/20261107000000_permohonan_kunjungan.sql`.
3. Copy seluruh isinya, paste ke SQL Editor, lalu **Run**.
4. Buka dashboard admin SIG Pusling, masuk ke tab **Permohonan**, klik
   **Cek Ulang**.

Setelah tabel dibuat, permohonan baru akan masuk ke database dan permohonan
yang disetujui otomatis tampil di kalender publik. Jika permohonan memiliki
kolom `lat` dan `lng` (diisi lewat peta pada formulir), lokasinya juga tampil
sebagai titik kunjungan di halaman peta.

> Untuk database yang sudah pernah menjalankan migrasi versi lama, jalankan
> ulang file SQL tersebut. Perintah `alter table ... add column if not exists`
> akan menambahkan kolom `lat`/`lng` dan memperbarui view
> `permohonan_terjadwal` tanpa menghapus data yang sudah ada.

## Kebijakan Akses

- **Anon / publik**: hanya boleh `insert` permohonan dan membaca view
  `permohonan_terjadwal`.
- **Authenticated / admin**: boleh membaca, mengubah, dan menghapus seluruh
  data permohonan.
- Data kontak pribadi tidak pernah ditampilkan di halaman publik.

> Catatan: siapa pun yang punya akun Supabase Auth di project ini dianggap
> admin. Jika ingin membatasi hanya email tertentu, tambahkan kondisi pada
> policy `permohonan_admin_*`, misalnya
> `using (auth.jwt() ->> 'email' = 'admin@contoh.com')`.
