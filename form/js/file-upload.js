// ========================================
// Bahagiakita - File Upload Handler
// Handler untuk drag-and-drop foto dan preview
// ========================================

(function() {
    'use strict';

    const uploadedFiles = {
        pria: null,
        wanita: null,
        portrait: [],
        landscape: []
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_PORTRAIT = 10;
    const MAX_LANDSCAPE = 6;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    // ========================================
    // Validation Functions
    // ========================================
    function validateFile(file) {
        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return {
                valid: false,
                message: 'Format file harus JPG, PNG, atau WebP'
            };
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                message: 'Ukuran file maksimal 5MB'
            };
        }

        return { valid: true };
    }

    function checkTotalSize() {
        let totalSize = 0;

        if (uploadedFiles.pria) totalSize += uploadedFiles.pria.size;
        if (uploadedFiles.wanita) totalSize += uploadedFiles.wanita.size;
        uploadedFiles.portrait.forEach(f => totalSize += f.size);
        uploadedFiles.landscape.forEach(f => totalSize += f.size);

        if (totalSize > 25 * 1024 * 1024) {
            alert('⚠️ Total ukuran semua foto melebihi 25MB. Silakan kurangi jumlah foto atau kompres foto Anda.');
        }
    }

    // ========================================
    // Preview Functions
    // ========================================
    function updatePreview(containerId, files, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        if (!files || files.length === 0) return;

        const fileList = Array.isArray(files) ? files : [files];

        fileList.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'photo-preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="photo-preview-remove">×</button>
                `;

                const removeBtn = preview.querySelector('.photo-preview-remove');
                removeBtn.addEventListener('click', () => {
                    removeFile(type, index);
                });

                container.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    }

    // ========================================
    // File Management Functions
    // ========================================
    function addSingleFile(type, file, containerId) {
        const validation = validateFile(file);
        if (!validation.valid) {
            alert(`❌ ${validation.message}`);
            return false;
        }

        uploadedFiles[type] = file;
        updatePreview(containerId, [file], type);
        checkTotalSize();
        return true;
    }

    function addMultipleFiles(type, files, containerId, maxCount) {
        const newFiles = Array.from(files);

        // Check max count
        if (uploadedFiles[type].length + newFiles.length > maxCount) {
            alert(`⚠️ Maksimal ${maxCount} foto ${type}`);
            return false;
        }

        // Validate all files
        for (const file of newFiles) {
            const validation = validateFile(file);
            if (!validation.valid) {
                alert(`❌ ${validation.message}\n\nFile: ${file.name}`);
                return false;
            }
        }

        uploadedFiles[type] = [...uploadedFiles[type], ...newFiles];
        updatePreview(containerId, uploadedFiles[type], type);
        checkTotalSize();
        return true;
    }

    function removeFile(type, index) {
        if (type === 'pria' || type === 'wanita') {
            uploadedFiles[type] = null;
            const containerId = `preview-${type}`;
            document.getElementById(containerId).innerHTML = '';
        } else if (type === 'portrait' || type === 'landscape') {
            uploadedFiles[type].splice(index, 1);
            const containerId = `preview-${type}`;
            updatePreview(containerId, uploadedFiles[type], type);
        }
        checkTotalSize();
    }

    // ========================================
    // Drag and Drop Setup
    // ========================================
    function setupDragDrop(zoneId, dropHandler) {
        const zone = document.getElementById(zoneId);
        if (!zone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.remove('drag-over');
            }, false);
        });

        zone.addEventListener('drop', dropHandler, false);
    }

    // ========================================
    // Event Listeners Setup
    // ========================================
    function setupUploadListeners() {
        // Foto Pria
        setupDragDrop('upload-pria', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                addSingleFile('pria', files[0], 'preview-pria');
            }
        });

        const inputPria = document.getElementById('file-pria');
        if (inputPria) {
            inputPria.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    addSingleFile('pria', e.target.files[0], 'preview-pria');
                }
            });
        }

        // Foto Wanita
        setupDragDrop('upload-wanita', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                addSingleFile('wanita', files[0], 'preview-wanita');
            }
        });

        const inputWanita = document.getElementById('file-wanita');
        if (inputWanita) {
            inputWanita.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    addSingleFile('wanita', e.target.files[0], 'preview-wanita');
                }
            });
        }

        // Foto Portrait (multiple)
        setupDragDrop('upload-portrait', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                addMultipleFiles('portrait', files, 'preview-portrait', MAX_PORTRAIT);
            }
        });

        const inputPortrait = document.getElementById('file-portrait');
        if (inputPortrait) {
            inputPortrait.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    addMultipleFiles('portrait', e.target.files, 'preview-portrait', MAX_PORTRAIT);
                }
            });
        }

        // Foto Landscape (multiple)
        setupDragDrop('upload-landscape', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                addMultipleFiles('landscape', files, 'preview-landscape', MAX_LANDSCAPE);
            }
        });

        const inputLandscape = document.getElementById('file-landscape');
        if (inputLandscape) {
            inputLandscape.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    addMultipleFiles('landscape', e.target.files, 'preview-landscape', MAX_LANDSCAPE);
                }
            });
        }
    }

    // ========================================
    // Get Uploaded Files
    // ========================================
    function getUploadedFiles() {
        return { ...uploadedFiles };
    }

    // ========================================
    // Clear All Photos (saat toggle Foto OFF)
    // ========================================
    function clearAll() {
        uploadedFiles.pria = null;
        uploadedFiles.wanita = null;
        uploadedFiles.portrait = [];
        uploadedFiles.landscape = [];

        ['pria', 'wanita'].forEach(type => {
            const preview = document.getElementById(`preview-${type}`);
            if (preview) preview.innerHTML = '';
            const input = document.getElementById(`file-${type}`);
            if (input) input.value = '';
        });

        ['portrait', 'landscape'].forEach(type => {
            const preview = document.getElementById(`preview-${type}`);
            if (preview) preview.innerHTML = '';
            const input = document.getElementById(`file-${type}`);
            if (input) input.value = '';
            const counter = document.getElementById(`counter-${type}`);
            if (counter) counter.textContent = '0';
        });
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        setupUploadListeners();
    }

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose functions for use in other scripts
    window.FileUpload = {
        getUploadedFiles: getUploadedFiles,
        validateFile: validateFile,
        clearAll: clearAll
    };

})();
