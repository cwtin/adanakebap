import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

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

const defaultProducts = {
  "adana-kebap": { name: "Adana Kebap", description: "", price: "", category: "Izgaralar", symbol: "🔥", image: "images/adana.webp", order: 1 },
  "kuzu-sis": { name: "Kuzu Şiş", description: "", price: "", category: "Izgaralar", symbol: "♨", image: "images/kuzusisdurum.webp", order: 2 },
  "kuzu-ciger": { name: "Kuzu Ciğer", description: "", price: "", category: "Izgaralar", symbol: "🔥", image: "images/kuzuciger.webp", order: 3 },
  "kuzu-pirzola": { name: "Kuzu Pirzola", description: "", price: "", category: "Izgaralar", symbol: "♨", image: "images/kuzupirzola.webp", order: 4 },
  "kofte": { name: "Köfte", description: "", price: "", category: "Izgaralar", symbol: "🔥", image: "images/kofte.webp", order: 5 },
  "sucuk": { name: "Sucuk", description: "", price: "", category: "Izgaralar", symbol: "♨", image: "images/sucukizgara.webp", order: 6 },
  "tavuk-kiyma": { name: "Tavuk Kıyma", description: "", price: "", category: "Tavuk", symbol: "🔥", image: "images/tavukkiyma.webp", order: 7 },
  "tavuk-sis": { name: "Tavuk Şiş", description: "", price: "", category: "Tavuk", symbol: "♨", image: "images/tavuksis.webp", order: 8 },
  "tavuk-kanat": { name: "Tavuk Kanat", description: "", price: "", category: "Tavuk", symbol: "🔥", image: "images/kanat.webp", order: 9 },
  "tavuk-kelebek": { name: "Tavuk Kelebek", description: "", price: "", category: "Tavuk", symbol: "♨", image: "images/tavukkelebek.webp", order: 10 },
  "mercimek-corbasi": { name: "Mercimek Çorbası", description: "", price: "", category: "Çorbalar", symbol: "♨", image: "images/mercimek.webp", order: 11 },
  "kelle-paca-corbasi": { name: "Kelle Paça Çorbası", description: "", price: "", category: "Çorbalar", symbol: "♨", image: "images/kellepaca.webp", order: 12 },
  "iskembe-corbasi": { name: "İşkembe Çorbası", description: "", price: "", category: "Çorbalar", symbol: "♨", image: "images/iskembe.webp", order: 13 }
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginView = document.querySelector("#loginView");
const panelView = document.querySelector("#panelView");
const loginForm = document.querySelector("#loginForm");
const loginButton = document.querySelector("#loginButton");
const loginError = document.querySelector("#loginError");
const logoutButton = document.querySelector("#logoutButton");
const adminProducts = document.querySelector("#adminProducts");
const notice = document.querySelector("#notice");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initializeMenuOnce() {
  const initializedSnap = await get(ref(db, "meta/initialized"));
  if (initializedSnap.exists() && initializedSnap.val() === true) return;

  const productsSnap = await get(ref(db, "products"));
  if (!productsSnap.exists()) {
    await set(ref(db, "products"), defaultProducts);
  }
  await update(ref(db, "meta"), { initialized: true, initializedAt: Date.now() });
}

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(showNotice.timer);
  showNotice.timer = setTimeout(() => { notice.hidden = true; }, 3500);
}

function renderProducts(data) {
  const products = Object.entries(data || {})
    .map(([id, product]) => ({ id, ...product }))
    .sort((a, b) => Number(a.order || 9999) - Number(b.order || 9999));

  adminProducts.innerHTML = products.map(product => `
    <article class="admin-card" data-id="${escapeHtml(product.id)}">
      <img src="${escapeHtml(product.image || "")}" alt="${escapeHtml(product.name || "Ürün")}">
      <div class="fields">
        <div class="meta">
          <span class="category">${escapeHtml(String(product.category || "").toLocaleUpperCase("tr-TR"))}</span>
          <span class="save-state" aria-live="polite"></span>
        </div>
        <label>Ürün adı
          <input class="name" type="text" maxlength="80" value="${escapeHtml(product.name || "")}">
        </label>
        <label>Açıklama
          <textarea class="description" maxlength="250" placeholder="Örn: Közlenmiş biber ve sumaklı soğan ile servis edilir.">${escapeHtml(product.description || "")}</textarea>
        </label>
        <label>Fiyat
          <div class="price-wrap">
            <input class="price" type="text" inputmode="decimal" maxlength="20" value="${escapeHtml(product.price || "")}" placeholder="Örn: 250">
            <span>TL</span>
          </div>
        </label>
        <div class="save-row">
          <button class="save-button" type="button">KAYDET</button>
        </div>
      </div>
    </article>
  `).join("");

  adminProducts.querySelectorAll(".save-button").forEach(button => {
    button.addEventListener("click", async () => {
      const card = button.closest(".admin-card");
      const id = card.dataset.id;
      const state = card.querySelector(".save-state");
      const name = card.querySelector(".name").value.trim();
      const description = card.querySelector(".description").value.trim();
      const price = card.querySelector(".price").value.trim();

      if (!name) {
        state.textContent = "Ürün adı boş olamaz.";
        return;
      }

      button.disabled = true;
      state.textContent = "Kaydediliyor...";
      try {
        await update(ref(db, `products/${id}`), { name, description, price });
        state.textContent = "✓ Kaydedildi";
        setTimeout(() => { state.textContent = ""; }, 2200);
      } catch (error) {
        console.error(error);
        state.textContent = "Kaydetme hatası";
      } finally {
        button.disabled = false;
      }
    });
  });
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginError.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = "GİRİŞ YAPILIYOR...";
  try {
    await signInWithEmailAndPassword(auth, document.querySelector("#email").value.trim(), document.querySelector("#password").value);
  } catch (error) {
    console.error(error);
    loginError.textContent = "Giriş başarısız. E-posta/şifreyi ve Firebase Email/Password ayarını kontrol et.";
    loginError.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "GİRİŞ YAP";
  }
});

logoutButton.addEventListener("click", () => signOut(auth));

let unsubscribeProducts = null;
onAuthStateChanged(auth, async user => {
  if (unsubscribeProducts) {
    unsubscribeProducts();
    unsubscribeProducts = null;
  }

  if (!user) {
    loginView.hidden = false;
    panelView.hidden = true;
    return;
  }

  loginView.hidden = true;
  panelView.hidden = false;

  try {
    await initializeMenuOnce();
    showNotice("Firebase bağlantısı hazır. Değişiklikler veritabanına kalıcı olarak kaydedilir.");
    unsubscribeProducts = onValue(ref(db, "products"), snapshot => renderProducts(snapshot.val()), error => {
      console.error(error);
      showNotice("Ürünler okunamadı. Realtime Database Rules ayarını kontrol et.");
    });
  } catch (error) {
    console.error(error);
    showNotice("Firebase başlatılamadı. Rules ayarını kontrol et.");
  }
});
