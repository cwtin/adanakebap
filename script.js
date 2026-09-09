import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCcxsSZBrM81YkYquZ6jB9quUwuimlCqqg",
  authDomain: "adanakebapevi-ac021.firebaseapp.com",
  databaseURL: "https://adanakebapevi-ac021-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "adanakebapevi-ac021",
  storageBucket: "adanakebapevi-ac021.firebasestorage.app",
  messagingSenderId: "1088098011834",
  appId: "1:1088098011834:web:21dd90a72b8c5074c1d083",
  measurementId: "G-HGSMEQH25N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const fallbackProducts = [
  { id: "adana-kebap", name: "Adana Kebap", description: "", price: "", category: "Izgaralar", symbol: "🔥", image: "images/adana.webp", order: 1 },
  { id: "kuzu-sis", name: "Kuzu Şiş", description: "", price: "", category: "Izgaralar", symbol: "♨", image: "images/kuzusisdurum.webp", order: 2 },
  { id: "kuzu-ciger", name: "Kuzu Ciğer", description: "", price: "", category: "Izgaralar", symbol: "🔥", image: "images/kuzuciger.webp", order: 3 },
  { id: "kuzu-pirzola", name: "Kuzu Pirzola", description: "", price: "", category: "Izgaralar", symbol: "♨", image: "images/kuzupirzola.webp", order: 4 },
  { id: "kofte", name: "Köfte", description: "", price: "", category: "Izgaralar", symbol: "🔥", image: "images/kofte.webp", order: 5 },
  { id: "sucuk", name: "Sucuk", description: "", price: "", category: "Izgaralar", symbol: "♨", image: "images/sucukizgara.webp", order: 6 },
  { id: "tavuk-kiyma", name: "Tavuk Kıyma", description: "", price: "", category: "Tavuk", symbol: "🔥", image: "images/tavukkiyma.webp", order: 7 },
  { id: "tavuk-sis", name: "Tavuk Şiş", description: "", price: "", category: "Tavuk", symbol: "♨", image: "images/tavuksis.webp", order: 8 },
  { id: "tavuk-kanat", name: "Tavuk Kanat", description: "", price: "", category: "Tavuk", symbol: "🔥", image: "images/kanat.webp", order: 9 },
  { id: "tavuk-kelebek", name: "Tavuk Kelebek", description: "", price: "", category: "Tavuk", symbol: "♨", image: "images/tavukkelebek.webp", order: 10 },
  { id: "mercimek-corbasi", name: "Mercimek Çorbası", description: "", price: "", category: "Çorbalar", symbol: "♨", image: "images/mercimek.webp", order: 11 },
  { id: "kelle-paca-corbasi", name: "Kelle Paça Çorbası", description: "", price: "", category: "Çorbalar", symbol: "♨", image: "images/kellepaca.webp", order: 12 },
  { id: "iskembe-corbasi", name: "İşkembe Çorbası", description: "", price: "", category: "Çorbalar", symbol: "♨", image: "images/iskembe.webp", order: 13 }
];

let products = [...fallbackProducts];
let activeCategory = "Tümü";

const productGrid = document.querySelector("#productGrid");
const categoryTabs = document.querySelector("#categoryTabs");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(text = "") {
  return String(text).toLocaleLowerCase("tr-TR").trim();
}

function normalizeProducts(data) {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .map(([id, product]) => ({ id, ...product }))
    .filter(product => product && product.name)
    .sort((a, b) => Number(a.order || 9999) - Number(b.order || 9999));
}

function formatPrice(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return /(?:₺|tl)$/i.test(raw) ? raw : `${raw} TL`;
}

function renderCategories() {
  const categories = ["Tümü", ...new Set(products.map(product => product.category).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = "Tümü";

  categoryTabs.innerHTML = categories.map(category => `
    <button class="tab ${category === activeCategory ? "active" : ""}"
            type="button" data-category="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join("");

  categoryTabs.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function renderProducts() {
  const query = normalizeText(searchInput.value);
  const filteredProducts = products.filter(product => {
    const categoryMatches = activeCategory === "Tümü" || product.category === activeCategory;
    const searchText = `${product.name || ""} ${product.description || ""}`;
    return categoryMatches && normalizeText(searchText).includes(query);
  });

  productGrid.innerHTML = filteredProducts.map((product, index) => {
    const price = formatPrice(product.price);
    const description = String(product.description || "").trim();
    return `
      <article class="product-card ${product.image ? "has-image" : ""}" data-symbol="${escapeHtml(product.symbol || "♨")}" style="animation-delay:${index * 45}ms">
        ${product.image ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">` : ""}
        <div class="product-info">
          <div class="product-top">
            <span class="product-number">${String(index + 1).padStart(2, "0")}</span>
            <span class="product-category">${escapeHtml(String(product.category || "").toLocaleUpperCase("tr-TR"))}</span>
          </div>
          <h3>${escapeHtml(product.name)}</h3>
          ${description ? `<p class="product-description">${escapeHtml(description)}</p>` : ""}
          <div class="product-bottom">
            ${price ? `<p class="product-price">${escapeHtml(price)}</p>` : `<p>Fiyat bilgisi için arayın</p>`}
            <a href="tel:+905309914301" aria-label="${escapeHtml(product.name)} için ara">${price ? "SİPARİŞ →" : "FİYAT SOR →"}</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  emptyState.hidden = filteredProducts.length !== 0;
}

searchInput.addEventListener("input", renderProducts);
document.querySelector("#year").textContent = new Date().getFullYear();

renderCategories();
renderProducts();

// Firebase verisi varsa HER ZAMAN onu kullanır. HTML/JS içindeki varsayılanlar
// sadece veritabanı henüz ilk kez oluşturulmadıysa ekranda geçici olarak görünür.
onValue(ref(db, "products"), snapshot => {
  if (!snapshot.exists()) return;
  const firebaseProducts = normalizeProducts(snapshot.val());
  if (!firebaseProducts.length) return;
  products = firebaseProducts;
  renderCategories();
  renderProducts();
}, error => {
  console.error("Menü Firebase'den okunamadı:", error);
});
