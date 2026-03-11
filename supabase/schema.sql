-- Jalankan script ini di SQL Editor Supabase.
-- Setelah itu buat user admin di Authentication > Users.
-- Lalu set role admin:
--   UPDATE public.profiles SET role = 'admin' WHERE id = 'UUID_USER_ADMIN';

create extension if not exists pgcrypto;

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  role text not null check (role in ('masyarakat', 'mitra', 'ormawa')),
  test_type text not null check (test_type in ('pretest', 'posttest')),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions > 0),
  score_percent numeric(5,2) not null check (score_percent >= 0 and score_percent <= 100),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('masyarakat', 'mitra', 'ormawa')),
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer_index integer not null check (answer_index >= 0 and answer_index <= 3),
  order_index integer not null default 1 check (order_index > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_quiz_results_updated_at on public.quiz_results;
create trigger set_quiz_results_updated_at
before update on public.quiz_results
for each row execute function public.set_updated_at();

drop trigger if exists set_quiz_questions_updated_at on public.quiz_questions;
create trigger set_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

alter table public.quiz_results enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.profiles enable row level security;

drop policy if exists quiz_results_select_all on public.quiz_results;
create policy quiz_results_select_all
on public.quiz_results
for select
to anon, authenticated
using (true);

drop policy if exists quiz_results_insert_all on public.quiz_results;
create policy quiz_results_insert_all
on public.quiz_results
for insert
to anon, authenticated
with check (true);

drop policy if exists quiz_results_update_admin on public.quiz_results;
create policy quiz_results_update_admin
on public.quiz_results
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists quiz_results_delete_admin on public.quiz_results;
create policy quiz_results_delete_admin
on public.quiz_results
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists quiz_questions_select_all on public.quiz_questions;
create policy quiz_questions_select_all
on public.quiz_questions
for select
to anon, authenticated
using (true);

drop policy if exists quiz_questions_insert_admin on public.quiz_questions;
create policy quiz_questions_insert_admin
on public.quiz_questions
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists quiz_questions_update_admin on public.quiz_questions;
create policy quiz_questions_update_admin
on public.quiz_questions
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists quiz_questions_delete_admin on public.quiz_questions;
create policy quiz_questions_delete_admin
on public.quiz_questions
for delete
to authenticated
using (public.is_admin(auth.uid()));

insert into public.quiz_questions (role, question_text, options, answer_index, order_index, is_active)
select seed.role, seed.question_text, seed.options, seed.answer_index, seed.order_index, true
from (
  values
    ('masyarakat', 'Saat hujan deras dan debit air naik, tindakan awal yang paling tepat adalah...', jsonb_build_array('Menunggu sampai air masuk rumah', 'Memantau informasi resmi dan menyiapkan evakuasi keluarga', 'Memindahkan kendaraan saja, lalu tidur kembali', 'Membuang sampah ke selokan agar air cepat turun'), 1, 1),
    ('masyarakat', 'Perilaku paling tepat untuk mencegah saluran tersumbat adalah...', jsonb_build_array('Membuang sampah organik ke got', 'Membuang sampah pada tempatnya dan kerja bakti rutin', 'Menutup saluran dengan papan', 'Membakar sampah di pinggir sungai'), 1, 2),
    ('masyarakat', 'Fungsi utama lubang biopori adalah...', jsonb_build_array('Mempercepat aliran limbah ke sungai', 'Menampung air minum rumah tangga', 'Meningkatkan daya resap tanah terhadap air hujan', 'Menggantikan seluruh saluran drainase'), 2, 3),
    ('masyarakat', 'Jika banjir mulai mengancam, warga sebaiknya berkoordinasi dengan...', jsonb_build_array('Akun media sosial anonim', 'RT/RW, BPBD, dan posko setempat', 'Pedagang kaki lima', 'Kelompok game online'), 1, 4),
    ('masyarakat', 'Isi tas siaga banjir yang paling prioritas adalah...', jsonb_build_array('Perhiasan dan koleksi foto', 'Dokumen penting, obat, air minum, dan senter', 'Peralatan musik', 'Alat masak besar'), 1, 5),
    ('mitra', 'Untuk mengurangi kerugian banjir, bahan baku lidi sebaiknya disimpan...', jsonb_build_array('Di lantai dasar tanpa alas', 'Di area lebih tinggi dengan rak tahan lembap', 'Di luar ruangan tanpa penutup', 'Di dekat saluran air terbuka'), 1, 1),
    ('mitra', 'Data penjualan UMKM yang aman saat bencana sebaiknya...', jsonb_build_array('Hanya ditulis pada satu buku', 'Dibackup digital dan disalin berkala', 'Disimpan dalam plastik tanpa salinan', 'Tidak perlu dicatat'), 1, 2),
    ('mitra', 'Saat bengkel produksi tergenang, tindakan awal paling tepat adalah...', jsonb_build_array('Tetap menyalakan mesin agar cepat selesai', 'Memutus aliran listrik dan mengamankan pekerja', 'Mengabaikan ketinggian air', 'Menyuruh semua orang berenang di lokasi'), 1, 3),
    ('mitra', 'Kemasan produk yang disarankan saat musim hujan adalah...', jsonb_build_array('Tanpa pelindung tambahan', 'Kemasan tahan lembap dan berlapis', 'Kertas tipis satu lapis', 'Kemasan bekas terbuka'), 1, 4),
    ('mitra', 'Komunikasi ke pelanggan saat banjir paling baik melalui...', jsonb_build_array('Informasi status pesanan lewat kanal resmi UMKM', 'Tidak memberi kabar apapun', 'Menghapus semua kontak', 'Menyebarkan janji palsu'), 0, 5),
    ('ormawa', 'Pendekatan awal ormawa ke masyarakat terdampak sebaiknya...', jsonb_build_array('Langsung memberi instruksi tanpa dialog', 'Mendengar kebutuhan warga dan membangun kepercayaan', 'Hanya fokus dokumentasi', 'Mengutamakan kegiatan seremonial'), 1, 1),
    ('ormawa', 'Data dasar yang penting dikumpulkan ormawa adalah...', jsonb_build_array('Preferensi hiburan warga', 'Peta risiko, kelompok rentan, dan kebutuhan mendesak', 'Konten viral media sosial', 'Daftar belanja pribadi relawan'), 1, 2),
    ('ormawa', 'Komunikasi risiko banjir yang baik dilakukan dengan...', jsonb_build_array('Bahasa jelas dan menyesuaikan konteks lokal', 'Istilah teknis tanpa penjelasan', 'Informasi menakutkan tanpa solusi', 'Pesan yang saling bertentangan'), 0, 3),
    ('ormawa', 'Dalam pelaksanaan program, ormawa sebaiknya...', jsonb_build_array('Bekerja terpisah dari RT/RW', 'Berkolaborasi dengan aparat dan tokoh lokal', 'Mengabaikan adat setempat', 'Menentukan keputusan sepihak'), 1, 4),
    ('ormawa', 'Tujuan utama edukasi banjir oleh ormawa adalah...', jsonb_build_array('Meningkatkan ketergantungan warga', 'Meningkatkan kapasitas warga agar siap dan tangguh', 'Hanya mencari publikasi', 'Mengurangi partisipasi masyarakat'), 1, 5)
) as seed(role, question_text, options, answer_index, order_index)
where not exists (
  select 1 from public.quiz_questions
);
