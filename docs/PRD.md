# PRD: Modernisasi & Rekonstruksi Website Bahagiakita (Tailwind CSS v4)

> **Dokumen:** Product Requirement Document (PRD)  
> **Versi:** 2.0 (Production Architecture)  
> **Target Eksekusi:** Antigravity Teamwork Multi-Agent System (`/teamwork-preview`)  
> **Spesifikasi CSS:** Tailwind CSS v4 (CSS-First Engine with `@theme`)  
> **Basis Sumber:** OpenDesign Handoff (`DESIGN-HANDOFF.md`, `DESIGN-MANIFEST.json`, `index.html`, `template.html`)  
> **Status:** Siap Review & Persetujuan User  

---

## 1. Executive Summary & Goals

### 1.1 Latar Belakang & Problem Statement
Repository ini berisi aset ekspor template OpenDesign untuk **Bahagiakita** (layanan undangan pernikahan digital profesional di Indonesia). Saat ini:
1. Kode template masih berupa file HTML monolitik dengan ratusan baris CSS mentah (`<style>` inline >700 baris) dan script inline yang belum terstruktur.
2. Masih terdapat artefak prototype OpenDesign (`data-od-id`, `data-screen-label`, prototype notes, dependensi path lokal `./images/...` yang hilang/404).
3. Belum memanfaatkan arsitektur modern **Tailwind CSS v4** (CSS-first `@theme`), Vite bundling, atau standar performa Core Web Vitals (LCP < 2.0s, CLS < 0.05).
4. Diperlukan rekonstruksi total menjadi **website produksi modern** yang estetik, ringan, responsif mobile-first, dan memiliki alur konversi WhatsApp yang mulus dan teruji.

### 1.2 Tujuan Utama (Product Goals)
1. **Visual & Brand Elevation**: Tampilan ultra-premium dengan nuansa sage green elegan, tipografi editorial (*Playfair Display* + *Inter* + aksen *Dancing Script*), micro-interactions halus, dan dukungan Dark Mode sempurna.
2. **Tailwind CSS v4 Architecture**: Mengadopsi arsitektur CSS-first engine modern tanpa dependensi konfigurasi JS lama (`tailwind.config.js`), menggunakan `@import "tailwindcss";` dan `@theme`.
3. **High Conversion to WhatsApp**: Seluruh call-to-action (CTA), pemilihan tema, dan form konsultasi terhubung langsung ke WhatsApp API dengan pesan kontekstual otomatis.
4. **Mobile-First & Touch Ergonomics**: Mematuhi aturan touch target minimum 44×44px, safe-area insets untuk notch/home bar, `min-h-dvh`, dan pencegahan horizontal overflow pada viewport 320px–430px.
5. **Production Readiness for Teamwork**: Menyediakan spesifikasi terverifikasi untuk dieksekusi oleh tim multi-agent `/teamwork-preview`.

---

## 2. Domain & Core Concepts

- **Undangan Digital**: Halaman web personal pasangan pengantin yang berisi informasi acara, hitung mundur (countdown), galeri foto/video, peta Google Maps, RSVP, musik latar, dan amplop digital/gift.
- **Sage Green Palette**: Identitas warna khas Bahagiakita yang merepresentasikan ketenangan, kesegaran, dan keanggunan pernikahan alami.
- **Template Gallery (`template.html`)**: Halaman katalog mandiri tempat calon pengantin menelusuri, memfilter (Classic, Modern, Minimal, Floral, Rustic, Luxury), mencari, dan memilih desain template undangan.
- **Conversion Touchpoints**: Titik interaksi yang mengarahkan prospek langsung ke WhatsApp Business Bahagiakita (+62 838-4763-0740) dengan template pesan otomatis.

---

## 3. Scope & User Flows

### 3.1 In Scope (P0 - Must Have)
- [x] **Setup Proyek Modern (Vite + Tailwind CSS v4)**:
  - Inisialisasi `package.json` dengan script standar (`dev`, `build`, `preview`).
  - Konfigurasi Tailwind v4 via Vite plugin / `@tailwindcss/vite`.
  - Struktur file bersih: `src/`, `public/`, `src/styles/`, `src/js/`.
- [x] **Halaman 1: Landing Page Utama (`index.html`)**:
  - **Header & Sticky Nav**: Glassmorphism, dynamic theme toggle (dark/light), mobile drawer menu.
  - **01 Hero Section**: H1 editorial dengan kata script "Berkesan", 2 CTA, 3 metrik statistik, mockup HP interaktif dengan visual SVG floral.
  - **02 Why Choose Us**: 4 pilar benefit (Mudah Dibagikan, Ramah Lingkungan, Fitur Lengkap, Desain Elegan).
  - **03 Features Showcase**: Grid 8 fitur esensial (Countdown, RSVP, Galeri, Maps, Ucapan, Gift, Musik, Nama Tamu).
  - **04 Template Showcase**: Preview dinamis dari katalog tema dengan palette dots dan filter cepat.
  - **05 Highlighted Features (Paket/Kenyamanan)**: 3 kartu fitur dengan fokus visual pada kartu tengah.
  - **06 How It Works**: 4 langkah pemesanan berurutan dengan nomor bulat & konektor step.
  - **07 Testimonial**: Kutipan ulasan pelanggan terpercaya dengan rating bintang & profil pengantin.
  - **08 FAQ**: Accordion interaktif (smooth collapse/expand, single-open).
  - **09 Final CTA**: Banner ajakan bertindak dengan latar sage elegan & tombol WhatsApp.
  - **Footer**: 4 kolom info lengkap (brand, menu, support, jam kerja & alamat SCBD) + copyright bar.
- [x] **Halaman 2: Galeri Template (`template.html`)**:
  - Filter kategori dinamis (All, Classic, Modern, Minimal, Floral, Rustic, Luxury).
  - Search bar interaktif dengan live filtering nama tema.
  - Empty state ramah pengguna jika pencarian nihil.
  - CTA box konsultasi kustom.
- [x] **Centralized Data Layer (`src/js/themes-data.js`)**:
  - Sumber kebenaran tunggal untuk 12+ varian tema undangan dengan skema warna, tag fitur, dan link WA otomatis.
- [x] **Asset Fallbacks & Zero Broken Images**:
  - Penanganan SVG lokal, logo berbasis vektor, dan placeholder thumbnail yang tidak bergantung pada server lokal yang hilang.
- [x] **Pembersihan OpenDesign Artifacts**:
  - Menghapus atribut internal `data-od-id`, `data-screen-label`, script speaker notes, dan tag prototype.

### 3.2 In Scope (P1 - Should Have)
- Smooth page transitions & hardware-accelerated animations (`transform`, `opacity`).
- Komprehensif SEO Meta & Open Graph (WhatsApp link preview, schema.org LocalBusiness + Product).
- Dark Mode toggle yang tersinkronisasi dengan `localStorage` dan preferensi sistem OS.

### 3.3 Out of Scope (P2 / Future Iteration)
- Sistem autentikasi pengguna / Dashboard admin pengantin (fase berikutnya).
- Integrasi payment gateway otomatis (Midtrans/Xendit) — saat ini konversi 100% via WhatsApp.
- Generator link nama tamu dinamis backend (diatur terpisah di sistem dashboard).

---

## 4. UI/UX & Tailwind v4 Specification

### 4.1 Tailwind v4 `@theme` Architecture (`src/styles/main.css`)
```css
@import "tailwindcss";

@theme {
  /* Color Palette: Sage Green Signature */
  --color-sage-50:  #f4f6f2;
  --color-sage-100: #e5ece2;
  --color-sage-200: #cbdbcb;
  --color-sage-300: #a7c2a7;
  --color-sage-400: #7e9c7e;
  --color-sage-500: #52634c; /* Primary Brand Accent */
  --color-sage-600: #465541;
  --color-sage-700: #394535;
  --color-sage-800: #2d352b; /* Text Primary Dark */
  --color-sage-900: #1b211a;

  /* Neutrals & Surfaces */
  --color-surface-light: #ffffff;
  --color-surface-dark:  #181e17;
  --color-bg-light:       #fbf9f5;
  --color-bg-dark:        #121612;

  /* Typography */
  --font-serif: "Playfair Display", Georgia, serif;
  --font-sans:  "Inter", system-ui, -apple-system, sans-serif;
  --font-sub:   "Poppins", sans-serif;
  --font-script: "Dancing Script", cursive;

  /* Spacing & Radii */
  --radius-card: 20px;
  --radius-pill: 9999px;

  /* Transitions & GPU hints */
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom Utilities */
@utility touch-target-safe {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}

@utility glass-nav {
  background-color: color-mix(in srgb, var(--color-surface-light) 80%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### 4.2 Mobile-First & Touch Ergonimics Checklist
1. **Dynamic Viewport Heights**: Gunakan `min-h-dvh` pada Hero Section dan drawer navigasi agar tidak terpotong oleh browser chrome di Safari iOS dan Chrome Android.
2. **Safe Area Insets**:
   ```css
   padding-top: calc(0.75rem + env(safe-area-inset-top));
   padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
   ```
3. **Touch Targets**: Seluruh tombol interaktif memiliki target minimal `44×44px` (`min-h-[44px]`).
4. **Horizontal Overflow Defense**: Seluruh wrapper body dan container utama diwajibkan `overflow-x-hidden w-full max-w-full`.
5. **No Layout Shift (CLS < 0.05)**: Semua container gambar dan thumbnail memiliki `aspect-ratio` eksplisit (`aspect-[3/4]`, `aspect-[9/16]`, atau `aspect-[16/9]`).

---

## 5. Technical Requirements & Architecture

### 5.1 Project Structure
```
web-bahagiakita/
├── package.json              # Project manifests & dependencies (vite, tailwindcss v4)
├── vite.config.js            # Multi-page build config (index.html & template.html)
├── docs/
│   └── PRD.md                # Dokumen PRD ini
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── styles/
│   │   └── main.css          # Tailwind CSS v4 CSS-first input (@theme)
│   ├── js/
│   │   ├── themes-data.js    # 12+ Template item dataset
│   │   ├── main.js           # Header, smooth scroll, theme toggle, mobile drawer
│   │   ├── gallery.js        # Category filter & search engine for template.html
│   │   └── faq.js            # Accessible single-open accordion
│   └── assets/
│       ├── logo.svg          # Crisp vector SVG brand mark
│       └── patterns/         # Subtle wedding & botanical vector patterns
├── index.html                # Main Production Landing Page
└── template.html             # Dedicated Template Gallery Page
```

### 5.2 Build & Multi-Page Configuration (`vite.config.js`)
```javascript
import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        template: resolve(__dirname, 'template.html'),
      },
    },
  },
});
```

### 5.3 WhatsApp Direct Integration Engine
Setiap tautan WhatsApp diformat sesuai standar WhatsApp API:
- Base: `https://wa.me/6283847630740?text=`
- General Order: `Halo Bahagiakita, saya ingin memesan undangan digital pernikahan.`
- Consultation: `Halo Bahagiakita, saya ingin konsultasi gratis mengenai undangan pernikahan digital.`
- Direct Template: `Halo Bahagiakita, saya tertarik dan ingin memesan template: [Nama Tema].`

---

## 6. Edge Cases & Risk Analysis

| Risiko / Edge Case | Dampak | Mitigasi |
|--------------------|--------|----------|
| Gambar thumbnail template gagal dimuat (404) | Tampilan katalog rusak / kosong | Sediakan thumbnail SVG inline / CSS gradient fallback elegan dengan inisial nama tema |
| Layar mobile sempit (320px iPhone SE) | Overflow horizontal, layout pecah | Gunakan fluid typography `clamp()`, grid auto-fit dengan `minmax(280px, 1fr)`, dan `overflow-x-hidden` |
| JavaScript dinonaktifkan di browser tamu | Konten template tidak tampil | Sediakan server-safe markup dasar atau noscript fallback untuk informasi kontak darurat |
| Accordion FAQ diakses via keyboard | Isu aksesibilitas pengguna disabilitas | Gunakan elemen native `<button>` dengan atribut `aria-expanded` dan `aria-controls` yang valid |

---

## 7. Acceptance Criteria (Definition of Done)

### AC-1: Arsitektur & Build System
- [ ] Script `npm run build` berjalan sukses tanpa error Rollup atau Vite, menghasilkan bundle aset di folder `dist/`.
- [ ] CSS dikompilasi melalui Tailwind CSS v4 engine (`@tailwindcss/vite` atau `@tailwindcss/cli`), dengan definisi palet di `@theme`.
- [ ] Tidak ada file dependensi template OpenDesign internal yang tertinggal dalam UI pengguna (`data-od-id`, `data-screen-label`, speaker notes).

### AC-2: Visual Fidelity & Responsivitas Viewport
- [ ] Tampilan terverifikasi sempurna tanpa horizontal scroll bar pada viewport standar: 360×800, 390×844, 430×932, 768×1024, dan 1440×900.
- [ ] Dark Mode toggle bekerja secara instan, mengubah tema warna background dan teks dengan kontras WCAG AA, serta menyimpan preferensi di `localStorage`.
- [ ] Tipografi menggunakan font serif *Playfair Display* untuk Heading, *Dancing Script* untuk aksen kata "Berkesan", dan *Inter* untuk body text.

### AC-3: Interaktivitas & State Management
- [ ] Navbar sticky berubah menjadi efek glassmorphism + shadow halus saat digulir lebih dari 50px.
- [ ] Hamburger menu membuka drawer mobile dari sisi kanan dengan backdrop blur, dan otomatis mengembalikan scroll body saat ditutup.
- [ ] FAQ Accordion hanya mengizinkan satu pertanyaan terbuka dalam satu waktu dengan transisi tinggi yang halus.
- [ ] Pada `template.html`, filter kategori dan input pencarian bekerja seketika (real-time filtering), serta menampilkan empty state saat data tidak ditemukan.

### AC-4: Integrasi WhatsApp & UX
- [ ] Seluruh tombol pemesanan dan template card membuka WhatsApp ke nomor `6283847630740` dengan teks pesan otomatis yang valid (URL encoded).
- [ ] Semua tombol dan elemen interaktif memiliki minimum touch target 44×44px.

---

## 8. Protokol Eksekusi Teamwork Multi-Agent

Setelah PRD ini disetujui:
1. **Agent Routing**: Diarahkan ke tim multi-agent `/teamwork-preview` di direktori proyek `/home/yusuf/Projects/web-bahagiakita`.
2. **Phased Execution**:
   - *Phase 1 (Foundation)*: Setup Vite + Tailwind v4 `@theme` + struktur direktori + data layer `themes-data.js`.
   - *Phase 2 (Landing Page Reconstruction)*: Bangun ulang `index.html` dengan 9 section esensial berbasis Tailwind v4.
   - *Phase 3 (Template Gallery Reconstruction)*: Bangun ulang `template.html` dengan filtering & search responsif.
   - *Phase 4 (Auditing & Verification)*: Build test, mobile viewport verification, no-horizontal-scroll audit, and link integrity.
