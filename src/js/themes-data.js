/**
 * src/js/themes-data.js
 * Centralized Data Layer for Bahagiakita Digital Wedding Invitation Themes
 */

export const OFFICIAL_WA_NUMBER = "6283847630740";

/**
 * Generates canonical WhatsApp consultation / order URL for a theme.
 * @param {string} themeName - Name of the template
 * @returns {string} Fully formatted WhatsApp URL
 */
export function generateWaLink(themeName) {
  const message = `Halo Bahagiakita, saya tertarik dan ingin memesan template: ${themeName}.`;
  return `https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const themesData = [
  {
    id: "theme-elegant-gold",
    name: "Elegant Gold Wedding",
    slug: "elegant-gold",
    category: "Classic",
    badge: "Populer",
    isFeatured: true,
    palette: ["#D4AF37", "#1A1A1A", "#F5E6D3"],
    gradient: { from: "#D4AF37", to: "#1A1A1A", deg: 165 },
    monogram: { line1: "Elegant", line2: "Gold Wedding" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Kombinasi klasik aksen emas berkilau dengan latar gelap dramatis untuk pernikahan mewah abadi.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Elegant Gold Wedding."
  },
  {
    id: "theme-navy-gold",
    name: "Navy & Gold Elegan",
    slug: "navy-gold",
    category: "Modern",
    badge: "Terfavorit",
    isFeatured: true,
    palette: ["#1A365D", "#B8860B", "#0F1F3A"],
    gradient: { from: "#1A365D", to: "#0F1F3A", deg: 165 },
    monogram: { line1: "Navy & Gold", line2: "Elegan" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Nuansa biru navy yang menenangkan berpadu dengan aksen foil emas kontemporer bergaya modern.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Navy & Gold Elegan."
  },
  {
    id: "theme-modern-minimalist",
    name: "Modern Minimalist",
    slug: "modern-minimalist",
    category: "Minimal",
    badge: "Eksklusif",
    isFeatured: true,
    palette: ["#F5F5F5", "#333333", "#FFFFFF"],
    gradient: { from: "#4A4A4A", to: "#1E1E1E", deg: 165 },
    monogram: { line1: "Modern", line2: "Minimalist" },
    features: ["Countdown", "RSVP", "Galeri", "Music"],
    description: "Desain serba bersih dengan fokus pada tipografi editorial dan ruang negatif yang bernafas lega.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Modern Minimalist."
  },
  {
    id: "theme-rose-garden",
    name: "Rose Garden Romance",
    slug: "rose-garden",
    category: "Floral",
    badge: "Favorit",
    isFeatured: false,
    palette: ["#C44569", "#F8BBD0", "#4A235A"],
    gradient: { from: "#C44569", to: "#4A235A", deg: 165 },
    monogram: { line1: "Rose Garden", line2: "Romance" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Sentuhan bunga mawar berona lembut dan ungu anggun yang memancarkan aura cinta romantis.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Rose Garden Romance."
  },
  {
    id: "theme-rustic-boho",
    name: "Rustic Bohemian",
    slug: "rustic-boho",
    category: "Rustic",
    badge: null,
    isFeatured: false,
    palette: ["#8B5E3C", "#D4A574", "#5C4033"],
    gradient: { from: "#8B5E3C", to: "#5C4033", deg: 165 },
    monogram: { line1: "Rustic", line2: "Bohemian" },
    features: ["Countdown", "RSVP", "Galeri", "Music"],
    description: "Tekstur kayu alami, aksen pampas grass kering, dan palet warna bumi (earthy tone) nan hangat.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Rustic Bohemian."
  },
  {
    id: "theme-royal-purple",
    name: "Royal Purple Luxe",
    slug: "royal-purple",
    category: "Luxury",
    badge: "Mewah",
    isFeatured: false,
    palette: ["#4A148C", "#FFD700", "#2E004F"],
    gradient: { from: "#4A148C", to: "#2E004F", deg: 165 },
    monogram: { line1: "Royal Purple", line2: "Luxe" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Keagungan rona ungu bangsawan dipadu kilau emas mewah untuk perhelatan sakral berkelas tinggi.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Royal Purple Luxe."
  },
  {
    id: "theme-sage-botanical",
    name: "Sage Green Botanical",
    slug: "sage-botanical",
    category: "Floral",
    badge: "Signature",
    isFeatured: false,
    palette: ["#739072", "#E8EAE5", "#4A5A4A"],
    gradient: { from: "#739072", to: "#394535", deg: 165 },
    monogram: { line1: "Sage Green", line2: "Botanical" },
    features: ["Countdown", "RSVP", "Galeri", "Music"],
    description: "Warna signature Bahagiakita dengan dedaunan eukaliptus segar, melambangkan harmoni dan ketenangan.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Sage Green Botanical."
  },
  {
    id: "theme-black-tie",
    name: "Black Tie Formal",
    slug: "black-tie",
    category: "Classic",
    badge: null,
    isFeatured: false,
    palette: ["#1C1C1C", "#C0C0C0", "#000000"],
    gradient: { from: "#2B2B2B", to: "#000000", deg: 165 },
    monogram: { line1: "Black Tie", line2: "Formal" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Monokrom klasik tuksedo dengan aksen perak halus bagi pasangan yang menyukai kesederhanaan formal.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Black Tie Formal."
  },
  {
    id: "theme-blush-pink",
    name: "Blush Pink Delicate",
    slug: "blush-pink",
    category: "Floral",
    badge: null,
    isFeatured: false,
    palette: ["#FFB6C1", "#FFF0F5", "#DB7093"],
    gradient: { from: "#DB7093", to: "#883355", deg: 165 },
    monogram: { line1: "Blush Pink", line2: "Delicate" },
    features: ["Countdown", "RSVP", "Galeri", "Music"],
    description: "Nuansa merah muda pastel manis dengan ornamen kelopak bunga lembut yang memikat hati.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Blush Pink Delicate."
  },
  {
    id: "theme-terracotta",
    name: "Terracotta Warmth",
    slug: "terracotta",
    category: "Rustic",
    badge: "Trending",
    isFeatured: false,
    palette: ["#E07A5F", "#F4A261", "#3D2C2E"],
    gradient: { from: "#E07A5F", to: "#3D2C2E", deg: 165 },
    monogram: { line1: "Terracotta", line2: "Warmth" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Gradasi tanah liat terakota Mediterania yang hangat, bersahaja, dan penuh energi kebersamaan.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Terracotta Warmth."
  },
  {
    id: "theme-midnight-sparkle",
    name: "Midnight Blue Sparkle",
    slug: "midnight-sparkle",
    category: "Luxury",
    badge: null,
    isFeatured: false,
    palette: ["#191970", "#FFD700", "#0D1B2A"],
    gradient: { from: "#191970", to: "#0D1B2A", deg: 165 },
    monogram: { line1: "Midnight Blue", line2: "Sparkle" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Kedalaman biru malam berpadu taburan bintang emas untuk pesta resepsi malam yang memesona.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Midnight Blue Sparkle."
  },
  {
    id: "theme-clean-white",
    name: "Clean White Studio",
    slug: "clean-white",
    category: "Minimal",
    badge: null,
    isFeatured: false,
    palette: ["#FFFFFF", "#E0E0E0", "#9E9E9E"],
    gradient: { from: "#71717A", to: "#27272A", deg: 165 },
    monogram: { line1: "Clean White", line2: "Studio" },
    features: ["Countdown", "RSVP", "Galeri"],
    description: "Estetika galeri seni kontemporer bernuansa monokrom bersih yang menonjolkan foto prewedding Anda.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Clean White Studio."
  },
  {
    id: "theme-monochrome-editorial",
    name: "Monochrome Editorial",
    slug: "monochrome-editorial",
    category: "Modern",
    badge: "Baru",
    isFeatured: false,
    palette: ["#262626", "#D4D4D8", "#0A0A0A"],
    gradient: { from: "#3F3F46", to: "#09090B", deg: 165 },
    monogram: { line1: "Monochrome", line2: "Editorial" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Tata letak bergaya majalah fesyen modern dengan tipografi serif kontras dan grid asimetris presisi.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Monochrome Editorial."
  },
  {
    id: "theme-emerald-art-deco",
    name: "Emerald Art Deco",
    slug: "emerald-art-deco",
    category: "Luxury",
    badge: "Baru",
    isFeatured: false,
    palette: ["#064E3B", "#FBBF24", "#022C22"],
    gradient: { from: "#064E3B", to: "#022C22", deg: 165 },
    monogram: { line1: "Emerald", line2: "Art Deco" },
    features: ["Countdown", "RSVP", "Galeri", "Music", "Gift"],
    description: "Pola geometris Art Deco khas tahun 1920-an dalam balutan zamrud mewah dan garis emas geometris.",
    waMessage: "Halo Bahagiakita, saya tertarik dan ingin memesan template: Emerald Art Deco."
  }
];

export const THEMES = themesData;

export const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "Classic", label: "Classic" },
  { id: "Modern", label: "Modern" },
  { id: "Minimal", label: "Minimal" },
  { id: "Floral", label: "Floral" },
  { id: "Rustic", label: "Rustic" },
  { id: "Luxury", label: "Luxury" }
];

// Attach to window for legacy browser/prototype compatibility if in browser context
if (typeof window !== 'undefined') {
  window.themesData = themesData;
  window.THEMES = themesData;
  window.CATEGORIES = CATEGORIES;
  window.OFFICIAL_WA_NUMBER = OFFICIAL_WA_NUMBER;
  window.generateWaLink = generateWaLink;
}

export default themesData;
