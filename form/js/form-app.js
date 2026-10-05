// ========================================
// Bahagiakita - Form App
// Logic utama: section navigation, scroll indicator, show/hide section kondisional
// ========================================

(function() {
    'use strict';

    // ========================================
    // Dark Mode Toggle & System Preference
    // ========================================
    function initDarkMode() {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (!toggleBtn) return;

        // Fungsi aman untuk ambil/simpan preferensi
        function getSavedMode() {
            try { return localStorage.getItem('theme-mode'); } catch (e) { return null; }
        }
        function saveMode(mode) {
            try { localStorage.setItem('theme-mode', mode); } catch (e) {}
        }

        const savedMode = getSavedMode();
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedMode === 'dark' || (!savedMode && systemPrefersDark)) {
            document.body.classList.add('dark-mode');
        }

        // Event listener toggle
        toggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            saveMode(isDark ? 'dark' : 'light');
        });

        // Event listener perubahan system (kalau belum di-override user)
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!getSavedMode()) {
                    if (e.matches) {
                        document.body.classList.add('dark-mode');
                    } else {
                        document.body.classList.remove('dark-mode');
                    }
                }
            });
        }
    }

    initDarkMode();

    // ========================================
    // Dot Navigation
    // ========================================
    const sections = [
        { id: 'section-kontak', label: 'Kontak' },
        { id: 'section-pria', label: 'Pria' },
        { id: 'section-wanita', label: 'Wanita' },
        { id: 'section-acara', label: 'Acara' },
        { id: 'section-gift', label: 'Gift' },
        { id: 'section-foto', label: 'Foto' },
        { id: 'section-fitur', label: 'Fitur' },
        { id: 'section-catatan', label: 'Catatan' }
    ];

    let dotNavigation = null;

    function createDotNavigation() {
        dotNavigation = document.createElement('div');
        dotNavigation.className = 'dot-navigation';

        sections.forEach((section, index) => {
            const dot = document.createElement('div');
            dot.className = 'dot-nav-item';
            dot.dataset.target = section.id;
            dot.title = section.label;

            dot.addEventListener('click', () => {
                scrollToSection(section.id);
            });

            dotNavigation.appendChild(dot);
        });

        document.body.appendChild(dotNavigation);
    }

    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    function updateActiveSection() {
        if (!dotNavigation) return;

        const dots = dotNavigation.querySelectorAll('.dot-nav-item');
        const scrollPosition = window.scrollY + window.innerHeight / 3;

        let activeSection = null;

        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (!element) return;

            // Skip hidden sections (section utama yang disembunyikan)
            if (element.classList.contains('hidden')) return;

            const rect = element.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionBottom = sectionTop + rect.height;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                activeSection = section.id;
            }
        });

        dots.forEach(dot => {
            if (dot.dataset.target === activeSection) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Hide dots for sections that have no visible content
        // (section utama tetap tampil tapi sub-section-nya bisa kosong)
        dots.forEach(dot => {
            const section = document.getElementById(dot.dataset.target);
            if (!section) {
                dot.style.display = 'none';
                return;
            }
            dot.style.display = 'block';
        });
    }

    // ========================================
    // Intersection Observer untuk Animasi Fade In
    // ========================================
    function setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section-animate').forEach(section => {
            observer.observe(section);
        });
    }

    // ========================================
    // Show/Hide Section Kondisional
    // ========================================
    function toggleSection(sectionId, show) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        if (show) {
            section.classList.remove('hidden');
            section.classList.add('slide-down');
            setTimeout(() => {
                section.classList.remove('slide-down');
            }, 400);
        } else {
            section.classList.add('slide-up');
            setTimeout(() => {
                section.classList.add('hidden');
                section.classList.remove('slide-up');
            }, 400);
        }

        // Update dot navigation after toggle
        setTimeout(updateActiveSection, 50);
    }

    // ========================================
    // Auto-generate Hari dari Tanggal
    // ========================================
    function generateHariFromTanggal(tanggalInput, hariInput) {
        if (!tanggalInput.value) return;

        const date = new Date(tanggalInput.value);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[date.getDay()];

        hariInput.value = dayName;
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        createDotNavigation();
        setupIntersectionObserver();
        setupAgamaSelection();
        setupPhotoModeSelection();
        setupConditionalSections();
        setupYouTubeToggle();
        setupAutoGenerateHari();
        setupRekeningDinamis();
        setupCopyAkadButton();
        setupCatatanCounter();

        window.addEventListener('scroll', updateActiveSection);
        updateActiveSection();
    }

    // ========================================
    // Setup Agama Selection & Dynamic Ceremony
    // ========================================
    const CEREMONY_PRESETS = {
        islam: {
            title: "Akad Nikah",
            desc: "Centang jika ada acara akad nikah",
            venuePlaceholder: "Masjid Al-Ikhlas"
        },
        kristen: {
            title: "Pemberkatan Nikah",
            desc: "Centang jika ada acara pemberkatan nikah",
            venuePlaceholder: "Gereja Bethany"
        },
        katolik: {
            title: "Sakramen Pernikahan",
            desc: "Centang jika ada acara sakramen pernikahan",
            venuePlaceholder: "Gereja Katedral"
        },
        hindu: {
            title: "Upacara Pawiwahan",
            desc: "Centang jika ada acara pawiwahan",
            venuePlaceholder: "Pura Jagatkartha"
        },
        buddha: {
            title: "Pemberkahan Nikah",
            desc: "Centang jika ada acara pemberkahan nikah",
            venuePlaceholder: "Vihara Dharma Bhakti"
        },
        universal: {
            title: "Janji Suci",
            desc: "Centang jika ada acara janji suci",
            venuePlaceholder: "Venue Utama / Gedung"
        }
    };

    window.currentCeremonyTitle = "Akad Nikah";

    function updateCeremonyLabels(religionKey) {
        const preset = CEREMONY_PRESETS[religionKey] || CEREMONY_PRESETS.islam;
        window.currentCeremonyTitle = preset.title;

        const cbTitle = document.getElementById('cb-acara-1-title');
        const cbDesc = document.getElementById('cb-acara-1-desc');
        const subTitle = document.getElementById('sub-acara-1-title');
        const copyBtn = document.getElementById('copy-akad-btn');
        const tempatAkad = document.getElementById('tempat-akad');

        if (cbTitle) cbTitle.textContent = preset.title;
        if (cbDesc) cbDesc.textContent = preset.desc;
        if (subTitle) subTitle.textContent = preset.title;
        if (copyBtn) copyBtn.textContent = 'Sama dengan ' + preset.title;
        if (tempatAkad) tempatAkad.placeholder = preset.venuePlaceholder;
    }

    function setupAgamaSelection() {
        const agamaRadios = document.querySelectorAll('input[name="agama"]');
        agamaRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    updateCeremonyLabels(radio.value);
                }
            });
        });

        // Init with checked radio
        const checkedAgama = document.querySelector('input[name="agama"]:checked');
        if (checkedAgama) {
            updateCeremonyLabels(checkedAgama.value);
        }
    }

    // ========================================
    // Setup Photo Mode Selection
    // ========================================
    function setupPhotoModeSelection() {
        const photoRadios = document.querySelectorAll('input[name="mode-foto"]');
        const subFoto = document.getElementById('sub-foto');
        const noPhotosCard = document.getElementById('no-photos-card');

        function applyPhotoMode(mode) {
            if (mode === 'tanpa-foto') {
                if (subFoto) subFoto.classList.add('hidden');
                if (noPhotosCard) noPhotosCard.classList.remove('hidden');
                if (window.FileUpload && window.FileUpload.clearAll) {
                    window.FileUpload.clearAll();
                }
            } else {
                if (subFoto) subFoto.classList.remove('hidden');
                if (noPhotosCard) noPhotosCard.classList.add('hidden');
            }
            setTimeout(updateActiveSection, 50);
        }

        photoRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    applyPhotoMode(radio.value);
                }
            });
        });

        const checkedRadio = document.querySelector('input[name="mode-foto"]:checked');
        if (checkedRadio) {
            applyPhotoMode(checkedRadio.value);
        }
    }

    // ========================================
    // Setup YouTube Video Toggle
    // ========================================
    function setupYouTubeToggle() {
        const toggleYouTube = document.getElementById('toggle-youtube');
        const subYouTube = document.getElementById('sub-youtube');
        if (toggleYouTube && subYouTube) {
            toggleYouTube.addEventListener('change', () => {
                toggleSection('sub-youtube', toggleYouTube.checked);
            });
        }
    }

    // ========================================
    // Setup Conditional Sections (toggles)
    // ========================================
    function setupConditionalSections() {
        // Akad checkbox
        const checkboxAkad = document.getElementById('checkbox-akad');
        const subAkad = document.getElementById('sub-akad');
        const copyAkadBtn = document.getElementById('copy-akad-btn');
        if (checkboxAkad && subAkad) {
            checkboxAkad.addEventListener('change', () => {
                toggleSection('sub-akad', checkboxAkad.checked);
                if (copyAkadBtn) {
                    copyAkadBtn.style.display = checkboxAkad.checked ? 'inline-block' : 'none';
                }
            });
            // Sync initial state
            if (copyAkadBtn) {
                copyAkadBtn.style.display = checkboxAkad.checked ? 'inline-block' : 'none';
            }
        }

        // Resepsi checkbox
        const checkboxResepsi = document.getElementById('checkbox-resepsi');
        const subResepsi = document.getElementById('sub-resepsi');
        if (checkboxResepsi && subResepsi) {
            checkboxResepsi.addEventListener('change', () => {
                toggleSection('sub-resepsi', checkboxResepsi.checked);
            });
        }

        // Gift toggle
        const toggleGift = document.getElementById('toggle-gift');
        const subGift = document.getElementById('sub-gift');
        if (toggleGift && subGift) {
            toggleGift.addEventListener('change', () => {
                toggleSection('sub-gift', toggleGift.checked);
            });
        }

        // Live Streaming toggle
        const toggleStreaming = document.getElementById('toggle-streaming');
        const subStreaming = document.getElementById('sub-streaming');
        if (toggleStreaming && subStreaming) {
            toggleStreaming.addEventListener('change', () => {
                toggleSection('sub-streaming', toggleStreaming.checked);
            });
        }

        // Love Story toggle
        const toggleLoveStory = document.getElementById('toggle-love-story');
        const subLoveStory = document.getElementById('sub-love-story');
        if (toggleLoveStory && subLoveStory) {
            toggleLoveStory.addEventListener('change', () => {
                toggleSection('sub-love-story', toggleLoveStory.checked);
            });
        }

        // Dress Code toggle
        const toggleDressCode = document.getElementById('toggle-dress-code');
        const subDressCode = document.getElementById('sub-dress-code');
        if (toggleDressCode && subDressCode) {
            toggleDressCode.addEventListener('change', () => {
                toggleSection('sub-dress-code', toggleDressCode.checked);
            });
        }

        // Protocols toggle
        const toggleProtocols = document.getElementById('toggle-protocols');
        const subProtocols = document.getElementById('sub-protocols');
        if (toggleProtocols && subProtocols) {
            toggleProtocols.addEventListener('change', () => {
                toggleSection('sub-protocols', toggleProtocols.checked);
            });
        }
    }

    // ========================================
    // Setup Auto-generate Hari dari Tanggal
    // ========================================
    function setupAutoGenerateHari() {
        const tanggalAkad = document.getElementById('tanggal-akad');
        const hariAkad = document.getElementById('hari-akad');
        if (tanggalAkad && hariAkad) {
            tanggalAkad.addEventListener('change', () => {
                generateHariFromTanggal(tanggalAkad, hariAkad);
            });
        }

        const tanggalResepsi = document.getElementById('tanggal-resepsi');
        const hariResepsi = document.getElementById('hari-resepsi');
        if (tanggalResepsi && hariResepsi) {
            tanggalResepsi.addEventListener('change', () => {
                generateHariFromTanggal(tanggalResepsi, hariResepsi);
            });
        }
    }

    // ========================================
    // Setup Rekening Dinamis (1/2/3)
    // ========================================
    function setupRekeningDinamis() {
        const radioButtons = document.querySelectorAll('input[name="jumlah-rekening"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                const jumlah = parseInt(radio.value);
                const rekeningSets = document.querySelectorAll('.rekening-set');

                rekeningSets.forEach((set, index) => {
                    if (index < jumlah) {
                        set.style.display = '';
                        set.classList.remove('hidden');
                        set.classList.add('slide-down');
                        setTimeout(() => set.classList.remove('slide-down'), 400);
                    } else {
                        set.style.display = 'none';
                        set.classList.add('hidden');
                    }
                });
            });
        });

        // Init: tampilkan hanya sesuai radio yang checked saat page load
        const checkedRadio = document.querySelector('input[name="jumlah-rekening"]:checked');
        if (checkedRadio) {
            const jumlah = parseInt(checkedRadio.value);
            const rekeningSets = document.querySelectorAll('.rekening-set');
            rekeningSets.forEach((set, index) => {
                if (index < jumlah) {
                    set.style.display = '';
                    set.classList.remove('hidden');
                } else {
                    set.style.display = 'none';
                    set.classList.add('hidden');
                }
            });
        }
    }

    // ========================================
    // Setup "Sama dengan Akad" Button
    // ========================================
    function setupCopyAkadButton() {
        const btn = document.getElementById('copy-akad-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const fields = [
                ['tanggal-akad', 'tanggal-resepsi'],
                ['hari-akad', 'hari-resepsi'],
                ['waktu-akad', 'waktu-resepsi'],
                ['tempat-akad', 'tempat-resepsi'],
                ['alamat-akad', 'alamat-resepsi'],
                ['maps-akad', 'maps-resepsi']
            ];

            fields.forEach(([fromId, toId]) => {
                const from = document.getElementById(fromId);
                const to = document.getElementById(toId);
                if (from && to) {
                    to.value = from.value;
                }
            });

            const ceremonyName = window.currentCeremonyTitle || 'Akad';
            btn.textContent = 'Disalin dari ' + ceremonyName;
            setTimeout(() => {
                btn.textContent = 'Sama dengan ' + ceremonyName;
            }, 2000);
        });
    }

    // ========================================
    // Setup Catatan Character Counter
    // ========================================
    function setupCatatanCounter() {
        const catatan = document.getElementById('catatan');
        const counter = document.getElementById('catatan-counter');
        if (catatan && counter) {
            catatan.addEventListener('input', () => {
                counter.textContent = catatan.value.length;
            });
        }
    }

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions for use in other scripts
    window.FormApp = {
        toggleSection: toggleSection,
        generateHariFromTanggal: generateHariFromTanggal,
        scrollToSection: scrollToSection
    };

})();
