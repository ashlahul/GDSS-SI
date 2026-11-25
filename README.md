# GDSS Ormawa — Sistem Pendukung Keputusan Kelompok (Metode Borda)

Website **Group Decision Support System (GDSS)** untuk penentuan prioritas program kerja organisasi mahasiswa menggunakan **Metode Borda (Borda Count)**, dibangun dengan **Next.js (App Router)**, **Prisma ORM**, **PostgreSQL**, dan **Tailwind CSS** untuk deployment di **Vercel**.

---

## Fitur Utama Sesuai Ketentuan Tugas UAS

1. **Multi-Account Login & Role Switcher (3 Decision Maker):**
   - **Ketua Umum** (`ketua@ormawa.ac.id` / `ketua123`) — *Jabatan Tertinggi*
   - **Sekretaris Jenderal** (`sekretaris@ormawa.ac.id` / `sekretaris123`)
   - **Bendahara Umum** (`bendahara@ormawa.ac.id` / `bendahara123`)

2. **Database PostgreSQL + Prisma ORM (Multi-Device Sync):**
   - Seluruh data (`DecisionMaker`, `ProgramKerja`, `Vote`, `ConsensusRecord`, `ConsensusDetail`) tersimpan di PostgreSQL.
   - Dilengkapi *auto-seeding* otomatis saat pertama kali diakses apabila tabel masih kosong.

3. **Penilaian Preferensi Individu & Konsensus Borda:**
   - Setiap pengambil keputusan menyusun urutan prioritas alternatif dari peringkat 1 hingga $N$.
   - Tombol **"Hitung & Sahkan Konsensus (Metode Borda)"** hanya terbuka setelah ketiga DM selesai menilai, dan hanya dapat dieksekusi oleh akun **Ketua Umum**.

4. **Transparansi Hasil & Cetak Berita Acara:**
   - Semua akun dapat melihat podium prioritas, grafik skor, matriks transparansi perhitungan, dan mencetak Berita Acara PDF resmi.

---

## Setup Database PostgreSQL (Neon / Supabase)

1. Buat database PostgreSQL gratis di [Neon](https://neon.tech) atau [Supabase](https://supabase.com) dan salin `Connection String`-nya.
2. Buka file `.env` (salin dari `.env.example` jika belum ada) dan isi:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
   ```
3. Push skema tabel Prisma ke PostgreSQL:
   ```bash
   npx prisma db push
   ```
4. Jalankan server lokal:
   ```bash
   npm run dev
   ```

## Deploy ke Vercel

1. Push proyek ini ke repository GitHub Anda (file `.env` otomatis terabaikan oleh `.gitignore`).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repository Anda.
3. Pada bagian **Environment Variables**, tambahkan:
   - Key: `DATABASE_URL`
   - Value: *Connection string PostgreSQL Neon/Supabase Anda*
4. Klik **Deploy**.
