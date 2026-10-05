// ========================================
// Bahagiakita - Form Submit Handler
// Handler untuk submit form ke Google Apps Script
// ========================================

(function () {
  "use strict";

  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx5GZVMdt7lTnZ-o-RfKlKIT4dwNfzzb-cN95F8bVF4yVcF5EWG_DC8A9z5GOaZRhXc/exec";

  // ========================================
  // Data Collection
  // ========================================
  function collectFormData() {
    const form = document.getElementById("wedding-form");
    if (!form) return null;

    const formData = new FormData(form);
    const data = {};

    // Get all form fields
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Helper untuk ambil element dengan null check
    const get = (id) => document.getElementById(id);
    const checkboxAkad = get("checkbox-akad");
    const checkboxResepsi = get("checkbox-resepsi");
    const toggleGift = get("toggle-gift");
    const toggleRsvp = get("toggle-rsvp");
    const toggleStreaming = get("toggle-streaming");
    const toggleYouTube = get("toggle-youtube");
    const toggleLoveStory = get("toggle-love-story");
    const toggleDressCode = get("toggle-dress-code");
    const toggleProtocols = get("toggle-protocols");

    // Agama & Nama Acara Utama
    const agamaEl = document.querySelector('input[name="agama"]:checked');
    data["agama"] = agamaEl ? agamaEl.value : "islam";
    data["nama-acara-1"] = window.currentCeremonyTitle || "Akad Nikah";

    // Handle conditional fields - set to "-" if section is hidden
    if (checkboxAkad && !checkboxAkad.checked) {
      [
        "tanggal-akad",
        "hari-akad",
        "waktu-akad",
        "tempat-akad",
        "alamat-akad",
        "maps-akad",
      ].forEach((k) => {
        data[k] = "-";
      });
    }

    if (checkboxResepsi && !checkboxResepsi.checked) {
      [
        "tanggal-resepsi",
        "hari-resepsi",
        "waktu-resepsi",
        "tempat-resepsi",
        "alamat-resepsi",
        "maps-resepsi",
      ].forEach((k) => {
        data[k] = "-";
      });
    }

    // Handle gift section - hanya isi "-" untuk rekening yang tidak tampil
    if (toggleGift && !toggleGift.checked) {
      [
        "jumlah-rekening",
        "bank-1",
        "nama-rek-1",
        "no-rek-1",
        "bank-2",
        "nama-rek-2",
        "no-rek-2",
        "bank-3",
        "nama-rek-3",
        "no-rek-3",
        "nama-penerima-kado",
        "alamat-kado",
        "hp-kado",
      ].forEach((k) => {
        data[k] = "-";
      });
    } else {
      // Gift ON: isi "-" untuk rekening yang hidden (lebih dari jumlah dipilih)
      const jumlahEl = document.querySelector(
        'input[name="jumlah-rekening"]:checked',
      );
      const jumlah = jumlahEl ? parseInt(jumlahEl.value) : 1;
      for (let i = jumlah + 1; i <= 3; i++) {
        data[`bank-${i}`] = "-";
        data[`nama-rek-${i}`] = "-";
        data[`no-rek-${i}`] = "-";
      }
      if (!data["nama-penerima-kado"] || data["nama-penerima-kado"].trim() === "") {
        data["nama-penerima-kado"] = "-";
      }
    }

    // Handle foto section (Mode Foto)
    const modeFotoEl = document.querySelector('input[name="mode-foto"]:checked');
    const isTanpaFoto = modeFotoEl && modeFotoEl.value === "tanpa-foto";
    data["mode-foto"] = modeFotoEl ? modeFotoEl.value : "pakai-foto";
    data["foto-enabled"] = isTanpaFoto ? "false" : "true";
    data["has-photos"] = isTanpaFoto ? "false" : "true";

    // Handle fitur section
    data["rsvp-enabled"] = toggleRsvp && toggleRsvp.checked ? "true" : "false";
    data["streaming-enabled"] =
      toggleStreaming && toggleStreaming.checked ? "true" : "false";
    data["youtube-enabled"] =
      toggleYouTube && toggleYouTube.checked ? "true" : "false";
    data["love-story-enabled"] =
      toggleLoveStory && toggleLoveStory.checked ? "true" : "false";
    data["dress-code-enabled"] =
      toggleDressCode && toggleDressCode.checked ? "true" : "false";
    data["protocols-enabled"] =
      toggleProtocols && toggleProtocols.checked ? "true" : "false";

    if (toggleStreaming && !toggleStreaming.checked) {
      data["link-streaming"] = "-";
    }

    if (toggleYouTube && !toggleYouTube.checked) {
      data["link-youtube"] = "-";
    } else if (!data["link-youtube"] || data["link-youtube"].trim() === "") {
      data["link-youtube"] = "-";
    }

    if (toggleLoveStory && !toggleLoveStory.checked) {
      data["cerita-love-story"] = "-";
    }

    if (toggleDressCode && !toggleDressCode.checked) {
      data["dress-code-theme"] = "-";
      data["dress-code-pria"] = "-";
      data["dress-code-wanita"] = "-";
      data["dress-code-note"] = "-";
    } else if (toggleDressCode && toggleDressCode.checked) {
      data["dress-code-theme"] = data["dress-code-theme"] || "-";
      data["dress-code-pria"] = data["dress-code-pria"] || "-";
      data["dress-code-wanita"] = data["dress-code-wanita"] || "-";
      data["dress-code-note"] = data["dress-code-note"] || "-";
    }

    if (toggleProtocols && !toggleProtocols.checked) {
      data["protocols-tips"] = "-";
      data["protocols-parking"] = "-";
    } else if (toggleProtocols && toggleProtocols.checked) {
      data["protocols-tips"] = data["protocols-tips"] || "-";
      data["protocols-parking"] = data["protocols-parking"] || "-";
    }

    // Add checkbox/toggle states
    data["checkbox-akad"] =
      checkboxAkad && checkboxAkad.checked ? "true" : "false";
    data["checkbox-resepsi"] =
      checkboxResepsi && checkboxResepsi.checked ? "true" : "false";
    data["toggle-gift"] = toggleGift && toggleGift.checked ? "true" : "false";

    return data;
  }

  // ========================================
  // Photo Encoding
  // ========================================
  async function encodePhotoToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // Remove data URL prefix
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function encodeAllPhotos() {
    const modeFotoEl = document.querySelector('input[name="mode-foto"]:checked');
    if (modeFotoEl && modeFotoEl.value === "tanpa-foto") {
      return {
        pria: null,
        wanita: null,
        portrait: [],
        landscape: [],
      };
    }

    const uploadedFiles = window.FileUpload.getUploadedFiles();
    const photos = {
      pria: null,
      wanita: null,
      portrait: [],
      landscape: [],
    };

    try {
      // Encode pria
      if (uploadedFiles.pria) {
        photos.pria = await encodePhotoToBase64(uploadedFiles.pria);
      }

      // Encode wanita
      if (uploadedFiles.wanita) {
        photos.wanita = await encodePhotoToBase64(uploadedFiles.wanita);
      }

      // Encode portrait
      for (const file of uploadedFiles.portrait) {
        const base64 = await encodePhotoToBase64(file);
        photos.portrait.push(base64);
      }

      // Encode landscape
      for (const file of uploadedFiles.landscape) {
        const base64 = await encodePhotoToBase64(file);
        photos.landscape.push(base64);
      }

      return photos;
    } catch (error) {
      console.error("Error encoding photos:", error);
      throw error;
    }
  }

  // ========================================
  // Submit Functions
  // ========================================
    function showLoading() {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.classList.add("show");
        }
    }

    function hideLoading() {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.classList.remove("show");
        }
    }

  function updateLoadingText(text) {
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  function showError(message) {
    const shouldRetry = confirm(
      `❌ Error: ${message}\n\nMencoba kirim ulang? Cancel untuk hubungi Admin via WhatsApp.`,
    );
    if (shouldRetry) {
      // Re-enable button so user can retry
      const submitBtn = document.getElementById("submit-btn");
      if (submitBtn) submitBtn.disabled = false;
    } else {
      // Open WhatsApp
      window.open("https://wa.me/6283847630740", "_blank");
      const submitBtn = document.getElementById("submit-btn");
      if (submitBtn) submitBtn.disabled = false;
    }
  }

    function showSuccess() {
        // Hide form + preview, show confirmation
        const form = document.getElementById("wedding-form");
        const preview = document.getElementById("preview-page");
        const confirmation = document.getElementById("confirmation-page");

        if (form) {
            form.classList.add("hidden");
        }
        if (preview) {
            preview.classList.add("hidden");
        }

        if (confirmation) {
            confirmation.classList.remove("hidden");
            confirmation.style.display = "";
            generateConfirmationSummary();
            generateConfirmationPhotos();
            generateWhatsAppLink();
    }
  }

  // ========================================
  // Generate Confirmation Summary
  // ========================================
  function generateConfirmationSummary() {
    const data = collectFormData();
    const summaryContent = document.getElementById("summary-content");
    if (!summaryContent) return;

    const RELIGION_LABELS = {
      islam: "Islam",
      kristen: "Kristen",
      katolik: "Katolik",
      hindu: "Hindu",
      buddha: "Buddha",
      universal: "Lainnya"
    };

    const rows = [];

    // Kontak
    if (data["nama-cp"]) rows.push(["Nama CP", data["nama-cp"]]);
    if (data["whatsapp"]) rows.push(["WhatsApp", data["whatsapp"]]);
    if (data["email"]) rows.push(["Email", data["email"]]);
    if (data["agama"]) rows.push(["Agama / Keyakinan", RELIGION_LABELS[data["agama"]] || data["agama"]]);

    // Mempelai
    if (data["nama-pria"]) rows.push(["Nama Pria", data["nama-pria"]]);
    if (data["nickname-pria"])
      rows.push(["Panggilan Pria", data["nickname-pria"]]);
    if (data["nama-wanita"]) rows.push(["Nama Wanita", data["nama-wanita"]]);
    if (data["nickname-wanita"])
      rows.push(["Panggilan Wanita", data["nickname-wanita"]]);

    // Acara
    const namaAcara1 = data["nama-acara-1"] || "Akad Nikah";
    if (data["checkbox-akad"] === "true") {
      rows.push([
        namaAcara1,
        `${data["hari-akad"]}, ${formatTanggal(data["tanggal-akad"])} - ${data["waktu-akad"]}`,
      ]);
      rows.push([`Tempat ${namaAcara1}`, data["tempat-akad"]]);
    }
    if (data["checkbox-resepsi"] === "true") {
      rows.push([
        "Resepsi",
        `${data["hari-resepsi"]}, ${formatTanggal(data["tanggal-resepsi"])} - ${data["waktu-resepsi"]}`,
      ]);
      rows.push(["Tempat Resepsi", data["tempat-resepsi"]]);
    }

    // Gift
    if (data["toggle-gift"] === "true") {
      rows.push(["Amplop Digital", "Aktif"]);
      rows.push(["Jumlah Rekening", data["jumlah-rekening"]]);
      if (data["nama-penerima-kado"] && data["nama-penerima-kado"] !== "-") {
        rows.push(["Penerima Kado", data["nama-penerima-kado"]]);
      }
    }

    // Foto
    if (data["mode-foto"] === "tanpa-foto" || data["has-photos"] === "false") {
      rows.push(["Konsep Foto", "Mode Tanpa Foto (Siluet Estetik)"]);
    } else {
      const files = window.FileUpload.getUploadedFiles();
      let fotoCount = 0;
      if (files.pria) fotoCount++;
      if (files.wanita) fotoCount++;
      fotoCount += files.portrait.length + files.landscape.length;
      rows.push(["Konsep Foto", `Pakai Foto (${fotoCount} foto diupload)`]);
    }

    // Fitur
    rows.push(["RSVP", data["rsvp-enabled"] === "true" ? "Aktif" : "Tidak"]);
    rows.push([
      "Live Streaming",
      data["streaming-enabled"] === "true" ? "Aktif" : "Tidak",
    ]);
    if (data["youtube-enabled"] === "true") {
      rows.push([
        "Video YouTube",
        data["link-youtube"] && data["link-youtube"] !== "-" ? data["link-youtube"] : "Aktif",
      ]);
    }
    rows.push([
      "Love Story",
      data["love-story-enabled"] === "true" ? "Aktif" : "Tidak",
    ]);
    if (data["dress-code-enabled"] === "true") {
      rows.push([
        "Dress Code",
        data["dress-code-theme"] && data["dress-code-theme"] !== "-"
          ? `Aktif (${data["dress-code-theme"]})`
          : "Aktif",
      ]);
    }
    if (data["protocols-enabled"] === "true") {
      rows.push(["Panduan Tamu", "Aktif"]);
    }

    // Catatan
    if (data["catatan"]) rows.push(["Catatan", data["catatan"]]);

    // Render
    summaryContent.innerHTML = rows
      .map(
        ([label, value]) => `
            <div class="flex justify-between gap-4 pb-2 border-b border-gray-100">
                <span class="font-medium text-gray-600">${label}:</span>
                <span class="text-dark-sage text-right">${value}</span>
            </div>
        `,
      )
      .join("");
  }

  function formatTanggal(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  // ========================================
  // Generate Confirmation Photos Preview
  // ========================================
  function generateConfirmationPhotos() {
    const data = collectFormData();
    const photosSection = document.getElementById("confirmation-photos");
    const photosContainer = document.getElementById("summary-photos");

    if (!photosContainer || !photosSection) return;

    if (data && (data["mode-foto"] === "tanpa-foto" || data["has-photos"] === "false")) {
      photosSection.classList.add("hidden");
      return;
    }

    const files = window.FileUpload.getUploadedFiles();

    const allFiles = [];
    if (files.pria) allFiles.push(files.pria);
    if (files.wanita) allFiles.push(files.wanita);
    allFiles.push(...files.portrait);
    allFiles.push(...files.landscape);

    if (allFiles.length === 0) {
      photosSection.classList.add("hidden");
      return;
    }

    photosSection.classList.remove("hidden");
    photosSection.style.display = '';
    photosContainer.innerHTML = "";

    allFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.createElement("div");
        preview.className = "photo-preview-item";
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        photosContainer.appendChild(preview);
      };
      reader.readAsDataURL(file);
    });
  }

  // ========================================
  // Generate WhatsApp Link with Pre-filled Message
  // ========================================
  function generateWhatsAppLink() {
    const data = collectFormData();
    const waLink = document.getElementById("confirmation-wa-link");
    if (!waLink) return;

    const namaCp = data["nama-cp"] || "";
    const namaPria = data["nickname-pria"] || data["nama-pria"] || "";
    const namaWanita = data["nickname-wanita"] || data["nama-wanita"] || "";

    const message = `Halo Admin Bahagiakita, saya ${namaCp} sudah mengisi form data undangan untuk ${namaPria} & ${namaWanita}. Mohon dikonfirmasi. Terima kasih 🙏`;
    const encodedMessage = encodeURIComponent(message);

    waLink.href = `https://wa.me/6283847630740?text=${encodedMessage}`;
  }

  async function sendDataWithRetry(data, photos, maxRetries = 1) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await sendData(data, photos);
        return response;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error);

        // Don't retry on last attempt
        if (attempt < maxRetries) {
          updateLoadingText(`Mencoba ulang (${attempt + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error("Failed to send data after retries");
  }

  async function sendChunk(payload) {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      // no-cors returns opaque response, can't read it
      // Network success = request reached server
      return true;
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }

  function buildIdentifier(data) {
    // Use resepsi date as fallback if akad unchecked
    const dateStr =
      data["checkbox-akad"] === "true"
        ? data["tanggal-akad"]
        : data["tanggal-resepsi"];

    // Format DDMMYYYY, fallback to today if missing
    let datePart = "";
    if (dateStr && dateStr !== "-") {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        datePart = `${dd}${mm}${yyyy}`;
      }
    }

    const pria = (data["nickname-pria"] || "client")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const wanita = (data["nickname-wanita"] || "client")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return `${pria}-${wanita}-${datePart}`;
  }

  async function sendData(data, photos) {
    const identifier = buildIdentifier(data);

    // Send text data first
    updateLoadingText("Mengirim data...");
    await sendChunk({ type: "text", data: data, identifier: identifier });

    // Send photos in chunks
    if (photos.pria) {
      updateLoadingText("Mengirim foto pria...");
      await sendChunk({
        type: "photo",
        category: "pria",
        photo: photos.pria,
        identifier: identifier,
      });
    }

    if (photos.wanita) {
      updateLoadingText("Mengirim foto wanita...");
      await sendChunk({
        type: "photo",
        category: "wanita",
        photo: photos.wanita,
        identifier: identifier,
      });
    }

    // Send portrait photos
    for (let i = 0; i < photos.portrait.length; i++) {
      updateLoadingText(
        `Mengirim foto portrait (${i + 1}/${photos.portrait.length})...`,
      );
      await sendChunk({
        type: "photo",
        category: "portrait",
        photo: photos.portrait[i],
        index: i,
        identifier: identifier,
      });
    }

    // Send landscape photos
    for (let i = 0; i < photos.landscape.length; i++) {
      updateLoadingText(
        `Mengirim foto landscape (${i + 1}/${photos.landscape.length})...`,
      );
      await sendChunk({
        type: "photo",
        category: "landscape",
        photo: photos.landscape[i],
        index: i,
        identifier: identifier,
      });
    }

    return { status: "success" };
  }

  // ========================================
  // Preview Page Functions
  // ========================================
  let cachedPhotos = null;
  let savedScrollPos = 0;

  function showPreview() {
    savedScrollPos = window.scrollY;
    const form = document.getElementById("wedding-form");
    const preview = document.getElementById("preview-page");
    if (form) form.classList.add("hidden");
    if (preview) {
      preview.classList.remove("hidden");
    }
    generatePreviewSummary();
    generatePreviewPhotos();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closePreview() {
    const form = document.getElementById("wedding-form");
    const preview = document.getElementById("preview-page");
    if (preview) {
      preview.classList.add("hidden");
    }
    if (form) {
      form.classList.remove("hidden");
    }
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) submitBtn.disabled = false;
    window.scrollTo({ top: savedScrollPos, behavior: "smooth" });
  }

  function generatePreviewSummary() {
    const data = collectFormData();
    const content = document.getElementById("preview-content");
    if (!content) return;

    const RELIGION_LABELS = {
      islam: "Islam",
      kristen: "Kristen",
      katolik: "Katolik",
      hindu: "Hindu",
      buddha: "Buddha",
      universal: "Lainnya"
    };

    const rows = [];

    if (data["nama-cp"]) rows.push(["Nama CP", data["nama-cp"]]);
    if (data["whatsapp"]) rows.push(["WhatsApp", data["whatsapp"]]);
    if (data["email"]) rows.push(["Email", data["email"]]);
    if (data["agama"]) rows.push(["Agama / Keyakinan", RELIGION_LABELS[data["agama"]] || data["agama"]]);
    if (data["nama-pria"]) rows.push(["Nama Pria", data["nama-pria"]]);
    if (data["nickname-pria"]) rows.push(["Panggilan Pria", data["nickname-pria"]]);
    if (data["nama-wanita"]) rows.push(["Nama Wanita", data["nama-wanita"]]);
    if (data["nickname-wanita"]) rows.push(["Panggilan Wanita", data["nickname-wanita"]]);

    const namaAcara1 = data["nama-acara-1"] || "Akad Nikah";
    if (data["checkbox-akad"] === "true") {
      rows.push([namaAcara1, `${data["hari-akad"]}, ${formatTanggal(data["tanggal-akad"])} - ${data["waktu-akad"]}`]);
      rows.push([`Tempat ${namaAcara1}`, data["tempat-akad"]]);
      if (data["alamat-akad"] && data["alamat-akad"] !== "-") rows.push([`Alamat ${namaAcara1}`, data["alamat-akad"]]);
    }
    if (data["checkbox-resepsi"] === "true") {
      rows.push(["Resepsi", `${data["hari-resepsi"]}, ${formatTanggal(data["tanggal-resepsi"])} - ${data["waktu-resepsi"]}`]);
      rows.push(["Tempat Resepsi", data["tempat-resepsi"]]);
      if (data["alamat-resepsi"] && data["alamat-resepsi"] !== "-") rows.push(["Alamat Resepsi", data["alamat-resepsi"]]);
    }

    if (data["toggle-gift"] === "true") {
      rows.push(["Amplop Digital", "Aktif"]);
      rows.push(["Jumlah Rekening", data["jumlah-rekening"]]);
      if (data["nama-penerima-kado"] && data["nama-penerima-kado"] !== "-") {
        rows.push(["Penerima Kado", data["nama-penerima-kado"]]);
      }
    }

    if (data["mode-foto"] === "tanpa-foto" || data["has-photos"] === "false") {
      rows.push(["Konsep Foto", "Mode Tanpa Foto (Siluet Estetik)"]);
    } else {
      const files = window.FileUpload.getUploadedFiles();
      let fotoCount = 0;
      if (files.pria) fotoCount++;
      if (files.wanita) fotoCount++;
      fotoCount += files.portrait.length + files.landscape.length;
      rows.push(["Konsep Foto", `Pakai Foto (${fotoCount} foto diupload)`]);
    }

    rows.push(["RSVP", data["rsvp-enabled"] === "true" ? "Aktif" : "Tidak"]);
    rows.push(["Live Streaming", data["streaming-enabled"] === "true" ? "Aktif" : "Tidak"]);
    if (data["youtube-enabled"] === "true") {
      rows.push(["Video YouTube", data["link-youtube"] && data["link-youtube"] !== "-" ? data["link-youtube"] : "Aktif"]);
    }
    rows.push(["Love Story", data["love-story-enabled"] === "true" ? "Aktif" : "Tidak"]);
    if (data["dress-code-enabled"] === "true") {
      rows.push(["Dress Code", data["dress-code-theme"] && data["dress-code-theme"] !== "-" ? `Aktif (${data["dress-code-theme"]})` : "Aktif"]);
    }
    if (data["protocols-enabled"] === "true") {
      rows.push(["Panduan Tamu", "Aktif"]);
    }
    if (data["catatan"] && data["catatan"] !== "-") rows.push(["Catatan", data["catatan"]]);

    content.innerHTML = rows.map(([label, value]) => `
      <div class="flex justify-between gap-4 pb-2 border-b border-gray-100">
        <span class="font-medium text-gray-600">${label}:</span>
        <span class="text-dark-sage text-right">${value}</span>
      </div>
    `).join("");
  }

  function generatePreviewPhotos() {
    const data = collectFormData();
    const grid = document.getElementById("preview-photos-grid");
    const section = document.getElementById("preview-photos");
    if (!grid || !section) return;

    if (data && (data["mode-foto"] === "tanpa-foto" || data["has-photos"] === "false")) {
      section.classList.add("hidden");
      return;
    }

    const files = window.FileUpload.getUploadedFiles();

    const allFiles = [];
    if (files.pria) allFiles.push(files.pria);
    if (files.wanita) allFiles.push(files.wanita);
    allFiles.push(...files.portrait);
    allFiles.push(...files.landscape);

    if (allFiles.length === 0) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    section.style.display = "";
    grid.innerHTML = "";

    allFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.createElement("div");
        preview.className = "photo-preview-item";
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        grid.appendChild(preview);
      };
      reader.readAsDataURL(file);
    });
  }

  // ========================================
  // Form Submit Handler — show preview first
  // ========================================
  function handleSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    // Validate form
    if (!window.FormValidation.validateForm()) {
      submitBtn.disabled = false;
      return;
    }

    // Show preview, don't submit yet
    showPreview();
  }

  // ========================================
  // Confirm & Submit (dari preview page)
  // ========================================
  async function confirmAndSubmit() {
    const confirmBtn = document.getElementById("preview-confirm-btn");
    const confirmText = document.getElementById("preview-confirm-text");
    const confirmSpinner = document.getElementById("preview-confirm-spinner");

    if (confirmBtn) confirmBtn.disabled = true;
    if (confirmText) confirmText.textContent = "Mengirim...";
    if (confirmSpinner) confirmSpinner.classList.remove("hidden");

    const backBtn = document.getElementById("preview-back-btn");
    if (backBtn) backBtn.disabled = true;

    try {
      showLoading();

      // Collect form data
      updateLoadingText("Mengumpulkan data...");
      const data = collectFormData();

      // Encode photos
      updateLoadingText("Memproses foto...");
      const photos = await encodeAllPhotos();
      cachedPhotos = photos;

      // Send data with retry
      const result = await sendDataWithRetry(data, photos);

      hideLoading();
      showSuccess();
    } catch (error) {
      console.error("Submit error:", error);
      hideLoading();

      if (confirmText) confirmText.textContent = "Kirim Data";
      if (confirmSpinner) confirmSpinner.classList.add("hidden");
      if (confirmBtn) confirmBtn.disabled = false;
      if (backBtn) backBtn.disabled = false;

      showError("Gagal mengirim data. Silakan coba lagi atau hubungi Admin.");
    }
  }

  // ========================================
  // Event Listeners Setup
  // ========================================
  function setupSubmitListener() {
    const form = document.getElementById("wedding-form");
    if (form) {
      form.addEventListener("submit", handleSubmit);
    }

    // Preview page buttons
    const confirmBtn = document.getElementById("preview-confirm-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", confirmAndSubmit);
    }

    const backBtn = document.getElementById("preview-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", closePreview);
    }
  }

  // ========================================
  // Initialize
  // ========================================
  function init() {
    setupSubmitListener();
  }

  // Run init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
