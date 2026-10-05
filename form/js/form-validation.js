// ========================================
// Bahagiakita - Form Validation
// Validasi client-side untuk form
// ========================================

(function() {
    'use strict';

    // ========================================
    // Validation Rules
    // ========================================
    const validationRules = {
        // Section 1: Kontak
        'nama-cp': {
            required: true,
            minLength: 3,
            message: 'Nama minimal 3 karakter'
        },
        'whatsapp': {
            required: true,
            pattern: /^62[0-9]{9,13}$/,
            message: 'Format: 62 diikuti 9-13 digit angka (contoh: 6281234567890)'
        },
        'email': {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Format email tidak valid'
        },

        // Section 2: Mempelai Pria
        'nama-pria': {
            required: true,
            minLength: 3,
            message: 'Nama minimal 3 karakter'
        },
        'nickname-pria': {
            required: true,
            minLength: 2,
            message: 'Nama panggilan minimal 2 karakter'
        },

        // Section 3: Mempelai Wanita
        'nama-wanita': {
            required: true,
            minLength: 3,
            message: 'Nama minimal 3 karakter'
        },
        'nickname-wanita': {
            required: true,
            minLength: 2,
            message: 'Nama panggilan minimal 2 karakter'
        },

        // Section 4: Acara
        'tanggal-akad': {
            conditional: () => document.getElementById('checkbox-akad').checked,
            required: true,
            futureDate: true,
            message: 'Tanggal harus di masa depan'
        },
        'waktu-akad': {
            conditional: () => document.getElementById('checkbox-akad').checked,
            required: true,
            message: 'Waktu akad wajib diisi'
        },
        'tempat-akad': {
            conditional: () => document.getElementById('checkbox-akad').checked,
            required: true,
            message: 'Tempat akad wajib diisi'
        },
        'alamat-akad': {
            conditional: () => document.getElementById('checkbox-akad').checked,
            required: true,
            minLength: 10,
            message: 'Alamat minimal 10 karakter'
        },
        'tanggal-resepsi': {
            conditional: () => document.getElementById('checkbox-resepsi').checked,
            required: true,
            futureDate: true,
            message: 'Tanggal harus di masa depan'
        },
        'waktu-resepsi': {
            conditional: () => document.getElementById('checkbox-resepsi').checked,
            required: true,
            message: 'Waktu resepsi wajib diisi'
        },
        'tempat-resepsi': {
            conditional: () => document.getElementById('checkbox-resepsi').checked,
            required: true,
            message: 'Tempat resepsi wajib diisi'
        },
        'alamat-resepsi': {
            conditional: () => document.getElementById('checkbox-resepsi').checked,
            required: true,
            minLength: 10,
            message: 'Alamat minimal 10 karakter'
        },
        'link-youtube': {
            conditional: () => {
                const toggle = document.getElementById('toggle-youtube');
                return toggle && toggle.checked;
            },
            pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
            message: 'Format URL YouTube tidak valid (contoh: https://youtube.com/watch?v=...)'
        }
    };

    // ========================================
    // Validation Functions
    // ========================================
    function validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const rules = validationRules[fieldId];

        if (!field || !rules) return true;

        // Check if field is conditional and should be validated
        if (rules.conditional && !rules.conditional()) {
            clearError(fieldId);
            return true;
        }

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = rules.message || 'Field ini wajib diisi';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = 'Field ini wajib diisi';
        }

        // MinLength validation
        if (isValid && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Pattern validation
        if (isValid && rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Future date validation
        if (isValid && rules.futureDate && value) {
            const inputDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (inputDate < today) {
                isValid = false;
                errorMessage = 'Tanggal harus di masa depan';
            }
        }

        // Show or clear error
        if (!isValid) {
            showError(fieldId, errorMessage);
        } else {
            clearError(fieldId);
        }

        return isValid;
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);

        if (field) {
            field.classList.add('error');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);

        if (field) {
            field.classList.remove('error');
        }

        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    function validateForm() {
        let isValid = true;
        let firstErrorField = null;

        // Validate all fields
        Object.keys(validationRules).forEach(fieldId => {
            if (!validateField(fieldId)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = fieldId;
                }
            }
        });

        // Special validation: at least one event must be selected
        const checkboxAkad = document.getElementById('checkbox-akad');
        const checkboxResepsi = document.getElementById('checkbox-resepsi');

        if (checkboxAkad && checkboxResepsi) {
            if (!checkboxAkad.checked && !checkboxResepsi.checked) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = 'checkbox-akad';
                }
                // Show error message for acara section
                const acaraError = document.getElementById('acara-error');
                if (acaraError) {
                    const ceremonyName = window.currentCeremonyTitle || 'Akad Nikah';
                    acaraError.textContent = `Minimal satu acara harus dipilih (${ceremonyName} atau Resepsi)`;
                    acaraError.classList.add('show');
                }
            }
        }

        // Special validation: if Gift ON, rekening yang tampil harus terisi lengkap
        const toggleGift = document.getElementById('toggle-gift');
        if (toggleGift && toggleGift.checked) {
            const jumlahRek = document.querySelector('input[name="jumlah-rekening"]:checked');
            const jumlah = jumlahRek ? parseInt(jumlahRek.value) : 1;

            for (let i = 1; i <= jumlah; i++) {
                const bank = document.getElementById(`bank-${i}`);
                const namaRek = document.getElementById(`nama-rek-${i}`);
                const noRek = document.getElementById(`no-rek-${i}`);

                // Skip jika set ini hidden (cek computed style, bukan class)
                const setElement = document.querySelector(`.rekening-set[data-set="${i}"]`);
                if (setElement && getComputedStyle(setElement).display === 'none') continue;

                if (bank && bank.value.trim() === '') {
                    isValid = false;
                    if (!firstErrorField) firstErrorField = `bank-${i}`;
                    showError(`bank-${i}`, 'Nama bank wajib diisi');
                }
                if (namaRek && namaRek.value.trim() === '') {
                    isValid = false;
                    if (!firstErrorField) firstErrorField = `nama-rek-${i}`;
                    showError(`nama-rek-${i}`, 'Nama pemilik rekening wajib diisi');
                }
                if (noRek && noRek.value.trim() === '') {
                    isValid = false;
                    if (!firstErrorField) firstErrorField = `no-rek-${i}`;
                    showError(`no-rek-${i}`, 'Nomor rekening wajib diisi');
                }
            }
        }

        // Scroll to first error
        if (firstErrorField) {
            const firstError = document.getElementById(firstErrorField);
            if (firstError) {
                firstError.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                firstError.focus();
            }
        }

        return isValid;
    }

    // ========================================
    // Event Listeners
    // ========================================
    function setupValidationListeners() {
        Object.keys(validationRules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            // Validate on blur
            field.addEventListener('blur', () => {
                validateField(fieldId);
            });

            // Clear error on input
            field.addEventListener('input', () => {
                clearError(fieldId);
            });
        });
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        setupValidationListeners();
    }

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions for use in other scripts
    window.FormValidation = {
        validateField: validateField,
        validateForm: validateForm,
        showError: showError,
        clearError: clearError
    };

})();
