# Original User Request

## 2026-09-16T06:38:51Z

Rekonstruksi dan modernisasi template landing page & galeri undangan digital "Bahagiakita" dari prototype OpenDesign menjadi website produksi berperforma tinggi menggunakan Tailwind CSS v4 (CSS-first engine `@theme`) dan Vite bundler.

Working directory: /home/yusuf/Projects/web-bahagiakita
Integrity mode: development
Reference document: docs/PRD.md

## Requirements

### R1. Modern Build Infrastructure & Tailwind CSS v4 Setup
Konfigurasikan arsitektur web modern menggunakan Vite dan Tailwind CSS v4 dengan CSS-first `@theme` di `src/styles/main.css`. Siapkan skrip `npm run dev` dan `npm run build` yang menghasilkan bundle multi-page (`index.html` dan `template.html`) yang bersih tanpa error.

### R2. Landing Page (`index.html`) Reconstruction
Bangun ulang halaman utama menjadi website yang responsif dan elegan dengan 9 section utama: Sticky Glassmorphism Header & Mobile Drawer, Hero Section dengan aksen tipografi Dancing Script & interactive phone mockup, Why Choose Us (4 pilar), Features Showcase (8 fitur), Template Preview, Highlighted Features, 4-Step How It Works, Testimonial, Single-Open FAQ Accordion, Final CTA, dan 4-Column Footer. Hapus seluruh artefak OpenDesign (`data-od-id`, `data-screen-label`, speaker notes).

### R3. Template Gallery (`template.html`) Reconstruction
Bangun ulang halaman galeri template yang terhubung dengan data terpusat (`src/js/themes-data.js`). Sediakan filter kategori interaktif (All, Classic, Modern, Minimal, Floral, Rustic, Luxury), live search bar, thumbnail dengan color palette dots & feature tags, dan empty state ramah pengguna.

### R4. WhatsApp Conversion Pipeline & Asset Integrity
Pastikan seluruh CTA dan tombol pemilihan template terhubung ke nomor WhatsApp resmi (+62 838-4763-0740) dengan template pesan otomatis yang ter-encode rapi. Sediakan fallback aset lokal (SVG logo dan pattern) sehingga tidak ada gambar yang patah (zero 404 broken images).

### R5. Mobile-First Ergonomics & Performance Compliance
Terapkan standar ergonomi mobile: dynamic viewport height (`min-h-dvh`), safe-area insets padding untuk notch, touch target minimum 44×44px, proteksi `overflow-x-hidden`, dan animasi terakselerasi GPU (`transform`, `opacity`).

## Acceptance Criteria

### Build & Integrity
- [ ] `npm run build` selesai tanpa error dan menghasilkan output siap deploy di folder `dist/`.
- [ ] Multi-page routing di `vite.config.js` memproses `index.html` dan `template.html` secara independen.
- [ ] Seluruh atribut prototype OpenDesign (`data-od-id`, `data-screen-label`, speaker-notes) bersih dari HTML produksi.

### Visual & Viewport Responsiveness
- [ ] Tidak ada horizontal scroll bar pada pengujian viewport: 360×800, 390×844, 430×932, 768×1024, dan 1440×900.
- [ ] Dark Mode toggle berfungsi instan, mengubah kontras warna sesuai WCAG AA, dan menyimpan status di `localStorage`.
- [ ] Tipografi menggunakan Playfair Display (Serif), Dancing Script (Script aksen), dan Inter (Body).

### Interactive Behavior
- [ ] Header sticky bertransisi ke glassmorphism saat scroll > 50px.
- [ ] Drawer menu mobile membuka mulus dari kanan dan mengunci scroll latar belakang.
- [ ] FAQ Accordion hanya membuka satu pertanyaan pada satu waktu dengan transisi mulus.
- [ ] Filter kategori dan pencarian di `template.html` menyaring daftar tema secara real-time.

### WhatsApp & Link Affordance
- [ ] Setiap tombol CTA mengarahkan ke link WhatsApp dengan nomor `6283847630740` dan teks pesan yang sesuai.
- [ ] Seluruh tombol dan kontrol interaktif memiliki touch target minimal 44×44px.

## Follow-up — 2026-09-17T02:04:31Z

saat ini anda masih bekerja dan berjalan kan? dan masih berapa lama lagi?

## Follow-up — 2026-09-17T02:21:25Z

lanjutkan, tapi kalau bisa sub agent jika tugasnya tidak terlalu berat anda bisa pakai model lain misal gemini model dibawahnya atau mode medium high atau low, sesuaikan dengan tugas masing"

## Follow-up — 2026-09-17T02:27:52Z

tunggu dulu saya akan deploy ke github pages saja, tidak ke hosting seperti itu apakah itu bisa?

## Follow-up — 2026-09-17T02:33:52Z

/goal bisakah anda ganti jangan pakai vite tapi cukup pakai tailwind css saja, dan bersihkan file" yang tidak perlu
