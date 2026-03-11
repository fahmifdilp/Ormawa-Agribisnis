# Setup Supabase (Gratis)

1. Buat project baru di Supabase (Free Plan).
2. Buka `SQL Editor`, jalankan isi file [supabase/schema.sql](./supabase/schema.sql).
3. Buka [supabase-config.js](./supabase-config.js), isi:
   - `url`: Project URL Supabase
   - `anonKey`: Project API Key (anon/public)
4. Di menu `Authentication > Users`, buat akun untuk admin.
5. Ambil UUID user admin, lalu jalankan SQL:
   ```sql
   INSERT INTO public.profiles (id, role)
   VALUES ('UUID_USER_ADMIN', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
   atau:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = 'UUID_USER_ADMIN';
   ```
6. Buka:
   - `index.html` untuk peserta (submit kuis + lihat laporan read-only)
   - `admin.html` untuk admin (login + edit/hapus laporan + kelola soal)

## Catatan

- Edit/hapus laporan hanya bisa dari `admin.html` dan dibatasi oleh RLS policy (`admin` only).
- Soal kuis bisa dikelola dari `admin.html` (tambah/edit/hapus), tabel: `public.quiz_questions`.
- Jika `supabase-config.js` belum diisi, aplikasi otomatis kembali ke mode lokal (`localStorage`).
- Jika sebelumnya sudah pernah setup, jalankan ulang [supabase/schema.sql](./supabase/schema.sql) agar tabel `quiz_questions` dan policy baru ikut terpasang.
