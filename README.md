# GDSS Ormawa — Sistem Pendukung Keputusan Kelompok (Hybrid TOPSIS + Borda)

Website **Group Decision Support System (GDSS)** untuk penentuan prioritas program kerja organisasi mahasiswa menggunakan **Hybrid Metode TOPSIS + Borda (Borda Count)**, dibangun dengan **Next.js (App Router)**, **Prisma ORM**, **PostgreSQL**, dan **Tailwind CSS** untuk deployment di **Vercel**.

---

## Fitur Utama Sesuai Ketentuan Tugas UAS

1. **Multi-Account Login (4 Decision Maker):**
   - **Ketua Umum** — Ashlahul Umam (`240605110008`, `ashlah@gmail.com` / `password123`) — *Jabatan Tertinggi*
   - **Wakil Ketua Umum** — Zakka Yogaraksa (`240605110009`, `zakka@gmail.com` / `password123`)
   - **Sekretaris Jenderal** — Muhammad Akmalul Fikri (`240605110147`, `akmal@gmail.com` / `password123`)
   - **Bendahara Umum** — Ega Fikri Prayoga (`240605110151`, `ega@gmail.com` / `password123`)

2. **Database PostgreSQL + Prisma ORM (Multi-Device Sync):**
   - Seluruh data (`DecisionMaker`, `ProgramKerja`, `Vote`, `ConsensusRecord`, `ConsensusDetail`) tersimpan di PostgreSQL.
   - Dilengkapi *auto-seeding* otomatis saat pertama kali diakses apabila tabel masih kosong.

3. **Penilaian Multi-Kriteria TOPSIS & Konsensus Borda:**
   - Setiap pengambil keputusan menilai alternatif berdasarkan 4 kriteria (**C1 Urgensi & Dampak [30%, Benefit]**, **C2 Kesiapan SDM & Admin [25%, Benefit]**, **C3 Keselarasan Visi & Sinergi [25%, Benefit]**, **C4 Beban Biaya & Risiko [20%, Cost]**).
   - Sistem menghitung nilai preferensi TOPSIS ($V_i$) untuk membentuk peringkat individu dan mengonversinya menjadi poin Borda ($N - k + 1$).
   - Tombol **"Hitung & Sahkan Konsensus (TOPSIS + Borda)"** hanya terbuka setelah keempat DM selesai menilai, dan hanya dapat dieksekusi oleh akun **Ketua Umum**.

4. **Transparansi Hasil & Cetak Berita Acara:**
   - Semua akun dapat melihat nilai $V_i$ TOPSIS tiap DM, podium prioritas, grafik skor Borda, matriks transparansi perhitungan, dan mencetak Berita Acara PDF resmi.

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
