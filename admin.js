// Оң жакты бөгөттөө
document.addEventListener('contextmenu', e => e.preventDefault());

// Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
document.addEventListener('copy', e => e.preventDefault());

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE6BOd8QJlHmo7cCDunwR20aC4eM6NvEA",
  authDomain: "kara-kul.firebaseapp.com",
  projectId: "kara-kul",
  storageBucket: "kara-kul.firebasestorage.app",
  messagingSenderId: "979298457663",
  appId: "1:979298457663:web:09969dc8007003cafc808a",
  measurementId: "G-ML2BEMNR3Z"
};

const ADMIN_PASSWORD = "ulii"; 

// Бул жердеги "Кийим-чече" деген ката сөз "Кийим-кече" деп оңдолду
const categoryTranslations = {
  "phone": "Телефондор", "tools": "Аспаптар", "auto": "Автоунаа", "house": "Кыймылсыз мүлк",
  "construction": "Курулуш", "job": "Жумуш", "food": "Тамак-аш", "tech": "Техника",
  "farm": "Дыйкан-чарба", "livestock": "Мал чарба", "sport": "Спорт", "game": "Киберспорт",
  "taxi": "Такси", "fuel": "Отун, көмүр", "kitchen": "Кофе, Ашкана", "beauty": "Сулуулук",
  "charity": "Кайрымдуулук", "clothes": "Кийим-кече", "services": "Кызматтар", "news": "Кабарлар"
};

const loginOverlay = document.getElementById('loginOverlay');
const adminContainer = document.getElementById('adminContainer');
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');
const logoutBtn = document.getElementById('logoutBtn');

const tabPending = document.getElementById('tabPending');
const tabActive = document.getElementById('tabActive');
const tabFeedbacks = document.getElementById('tabFeedbacks');

const adsContainer = document.getElementById('ads-container');
const feedbacksContainer = document.getElementById('feedbacks-container');
const loadingEl = document.getElementById('loading');
const counterText = document.getElementById('counterText');

let currentTab = "pending"; 
let adsCache = {};
let unsubscribe = null;

togglePassword.onclick = () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
};

if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
  loginOverlay.style.display = 'none';
  adminContainer.style.display = 'block';
  initAdminPanel();
}

loginBtn.onclick = () => { checkPassword(); };
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkPassword(); });

function checkPassword() {
  if (passwordInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    loginOverlay.style.display = 'none';
    adminContainer.style.display = 'block';
    initAdminPanel();
  } else {
    errorMsg.style.display = 'block';
    passwordInput.classList.add('error');
  }
}

logoutBtn.onclick = () => {
  sessionStorage.removeItem('isAdminLoggedIn');
  window.location.reload();
};

function initAdminPanel() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  autoDeleteOldAds(db);

  tabPending.onclick = () => {
    if (currentTab === "pending") return;
    currentTab = "pending";
    updateTabStyles();
    autoDeleteOldAds(db); 
    loadData(db);
  };

  tabActive.onclick = () => {
    if (currentTab === "active") return;
    currentTab = "active";
    updateTabStyles();
    autoDeleteOldAds(db);
    loadData(db);
  };

  tabFeedbacks.onclick = () => {
    if (currentTab === "feedbacks") return;
    currentTab = "feedbacks";
    updateTabStyles();
    loadData(db);
  };

  loadData(db);
}

async function autoDeleteOldAds(db) {
  try {
    const expirationTime = 7 * 24 * 60 * 60 * 1000; 
    const now = new Date();
    const adsRef = collection(db, "ads");
    const snapshot = await getDocs(adsRef);
    
    snapshot.forEach(async (docSnap) => {
      const ad = docSnap.data();
      if (ad.createdAt) {
        const createdDate = ad.createdAt.toDate();
        const diffTime = now - createdDate; 

        if (diffTime > expirationTime) {
          await deleteDoc(doc(db, "ads", docSnap.id));
          console.log(`Убактысы бүттү, базадан автоматтык өчүрүлдү: ${docSnap.id}`);
        }
      }
    });
  } catch (err) {
    console.error("Автоматтык тазалоодо ката кетти:", err);
  }
}

function updateTabStyles() {
  tabPending.classList.toggle('active', currentTab === "pending");
  tabActive.classList.toggle('active', currentTab === "active");
  tabFeedbacks.classList.toggle('active', currentTab === "feedbacks");
}

function loadData(db) {
  loadingEl.style.display = "block";
  adsContainer.innerHTML = "";
  feedbacksContainer.innerHTML = "";
  adsCache = {};

  if (unsubscribe) unsubscribe();

  if (currentTab === "feedbacks") {
    adsContainer.style.display = "none";
    feedbacksContainer.style.display = "flex";

    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    unsubscribe = onSnapshot(q, (snapshot) => {
      feedbacksContainer.innerHTML = "";
      loadingEl.style.display = "none";
      let count = snapshot.size;
      counterText.innerText = `Келген пикирлер: ${count}`;

      if (count === 0) {
        feedbacksContainer.innerHTML = `<p class="empty-msg">Азырынча эч кандай пикир келе элек. 😊</p>`;
        return;
      }

      snapshot.forEach((docSnap) => {
        const fb = docSnap.data();
        const fbId = docSnap.id;
        const dateStr = fb.createdAt ? fb.createdAt.toDate().toLocaleString('ky-KG') : "Жаңы";

        const fbCard = document.createElement('div');
        fbCard.className = 'feedback-card';
        fbCard.innerHTML = `
          <div class="feedback-header">
            <div>
              <div class="feedback-email"><i class="fas fa-envelope"></i> ${fb.email || 'Жашыруун колдонуучу'}</div>
              <div class="feedback-time"><i class="fas fa-clock"></i> ${dateStr}</div>
            </div>
            <button class="btn btn-delete" style="width:auto; padding: 6px 12px;" data-id="${fbId}"><i class="fas fa-trash"></i></button>
          </div>
          <div class="feedback-message">${fb.message || 'Текст бош'}</div>
        `;
        feedbacksContainer.appendChild(fbCard);
      });

      setupFeedbackDeleteEvents(db);
    }, (err) => {
      console.error(err);
      loadingEl.style.display = "none";
    });

  } else {
    adsContainer.style.display = "grid";
    feedbacksContainer.style.display = "none";

    const targetCollection = currentTab === "pending" ? "pending_ads" : "ads";
    const q = query(collection(db, targetCollection), orderBy("createdAt", "desc"));

    unsubscribe = onSnapshot(q, (snapshot) => {
      adsContainer.innerHTML = "";
      loadingEl.style.display = "none";
      adsCache = {};
      
      let count = snapshot.size;
      counterText.innerText = currentTab === "pending" ? `Модерация: ${count}` : `Сайтта жалпы: ${count}`;

      if (count === 0) {
        adsContainer.innerHTML = `<p class="empty-msg">Бул бөлүмдө жарнама жок. 😊</p>`;
        return;
      }

      snapshot.forEach((docSnap) => {
        const ad = docSnap.data();
        const adId = docSnap.id;
        adsCache[adId] = ad;

        let imgList = [];
        if (ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
          imgList = ad.images;
        } else if (ad.image) {
          imgList = [ad.image];
        }

        let sliderHtml = "";
        if (imgList.length === 0) {
          sliderHtml = `<div class="slider-container" style="color:#94a3b8; display:flex; justify-content:center; align-items:center;"><i class="fas fa-image fa-2x"></i></div>`;
        } else {
          let slides = imgList.map(imgUrl => `<div class="slider-slide"><img src="${imgUrl}" alt="Жарнама сүрөтү"></div>`).join('');
          let controls = imgList.length > 1 
            ? `<button class="slider-btn prev" onclick="moveSlider('${adId}', -1)"><i class="fas fa-chevron-left"></i></button>
               <button class="slider-btn next" onclick="moveSlider('${adId}', 1)"><i class="fas fa-chevron-right"></i></button>
               <div class="slider-badge" id="badge-${adId}">1/${imgList.length}</div>`
            : "";
          
          sliderHtml = `
            <div class="slider-container" id="slider-${adId}" data-current="0" data-total="${imgList.length}">
              <div class="slider-track" id="track-${adId}">${slides}</div>
              ${controls}
            </div>
          `;
        }

        const card = document.createElement('div');
        card.className = 'ad-card';

        const rawCategory = ad.category || 'none';
        const kyrgyzCategory = categoryTranslations[rawCategory] || rawCategory;

        // Күтүүдөгү жарнамалар үчүн категорияны өзгөртүү мүмкүнчүлүгү
        let categorySelectorHtml = "";
        if (currentTab === "pending") {
          let options = Object.keys(categoryTranslations).map(key => {
            const selected = key === rawCategory ? "selected" : "";
            return `<option value="${key}" ${selected}>${categoryTranslations[key]}</option>`;
          }).join('');

          categorySelectorHtml = `
            <div style="margin-bottom: 10px;">
              <label style="font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; font-weight: bold;">Категорияны оңдоо:</label>
              <select class="category-select" id="select-${adId}" style="width: 100%; padding: 7px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; background-color: #f8fafc; cursor: pointer;">
                ${options}
              </select>
            </div>
          `;
        } else {
          categorySelectorHtml = `<span><i class="fas fa-folder" style="color:#64748b; width:14px;"></i> Бөлүм: <b>${kyrgyzCategory}</b></span>`;
        }

        let statusBadge = "";
        if (ad.createdAt && currentTab === "active") {
          const createdDate = ad.createdAt.toDate();
          const now = new Date();
          const diffTime = Math.abs(now - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays > 7) {
            statusBadge = `<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 8px; display: inline-block;"><i class="fas fa-exclamation-triangle"></i> Мөнөтү бүттү (7 күн өттү)</div>`;
          }
        }

        const actionButtons = currentTab === "pending" 
          ? `<button class="btn btn-approve" data-id="${adId}"><i class="fas fa-check"></i> Чыгаруу</button>
             <button class="btn btn-delete" data-id="${adId}"><i class="fas fa-trash"></i> Өчүрүү</button>`
          : `<button class="btn btn-delete" data-id="${adId}"><i class="fas fa-trash"></i> Өчүрүү</button>`;

        // БУЛ ЖЕРДЕ БААСЫ ДЕГЕН СӨЗ КУРАЛДЫ:
        card.innerHTML = `
          ${sliderHtml}
          <div style="padding: 12px 0 0 0;">${statusBadge}</div>
          <h3 class="ad-title" style="margin-top:0;">${ad.title || 'Сүрөттөмөсү жок'}</h3>
          <div class="ad-price">Баасы: ${ad.price} ${ad.currency || 'Сом'}</div>
          <div class="ad-meta" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
            ${categorySelectorHtml}
            <span><i class="fas fa-phone" style="color:#64748b; width:14px;"></i> Тел: <a href="tel:${ad.phone}">${ad.phone}</a></span>
          </div>
          <div class="actions">${actionButtons}</div>
        `;
        adsContainer.appendChild(card);
        
        if (imgList.length > 1) {
          setupTouchSlider(adId);
        }
      });

      setupActionEvents(db);
    }, (err) => {
      console.error(err);
      loadingEl.style.display = "none";
    });
  }
}

window.moveSlider = function(adId, direction) {
  const slider = document.getElementById(`slider-${adId}`);
  const track = document.getElementById(`track-${adId}`);
  const badge = document.getElementById(`badge-${adId}`);
  if (!slider || !track) return;

  let current = parseInt(slider.getAttribute('data-current'));
  let total = parseInt(slider.getAttribute('data-total'));

  current += direction;

  if (current >= total) current = 0;
  if (current < 0) current = total - 1;

  slider.setAttribute('data-current', current);
  track.style.transform = `translateX(-${current * 100}%)`;
  if (badge) badge.innerText = `${current + 1}/${total}`;
}

function setupTouchSlider(adId) {
  setTimeout(() => {
    const slider = document.getElementById(`slider-${adId}`);
    if (!slider) return;
    let startX = 0;
    let endX = 0;

    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, {passive: true});

    slider.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      let diff = startX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          moveSlider(adId, 1);
        } else {
          moveSlider(adId, -1);
        }
      }
    }, {passive: true});
  }, 100);
}

function setupActionEvents(db) {
  document.querySelectorAll('.btn-approve').forEach(button => {
    button.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      const adData = adsCache[id];
      if (!adData) return;

      const selectEl = document.getElementById(`select-${id}`);
      const chosenCategory = selectEl ? selectEl.value : (adData.category || "none");

      if (confirm("Бул жарнаманы башкы бетке чыгарасызбы?")) {
        try {
          button.disabled = true;
          await addDoc(collection(db, "ads"), {
            title: adData.title || "",
            category: chosenCategory, 
            price: adData.price || "0",
            currency: adData.currency || "Сом",
            phone: adData.phone || "",
            image: adData.image || "",
            images: adData.images || (adData.image ? [adData.image] : []),
            createdAt: serverTimestamp(),
            views: 0
          });
          await deleteDoc(doc(db, "pending_ads", id));
          alert("Ийгиликтүү ишке кирди!");
        } catch (err) {
          console.error(err);
          button.disabled = false;
        }
      }
    };
  });

  document.querySelectorAll('.btn-delete').forEach(button => {
    button.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      const targetCollection = currentTab === "pending" ? "pending_ads" : "ads";
      
      if (confirm("Бул жарнаманы базадан өчүрүүнү каалайсызбы?")) {
        try {
          button.disabled = true;
          await deleteDoc(doc(db, targetCollection, id));
          alert("Жарнама ийгиликтүү өчүрүлдү!");
        } catch (err) {
          console.error(err);
          button.disabled = false;
        }
      }
    };
  });
}

function setupFeedbackDeleteEvents(db) {
  feedbacksContainer.querySelectorAll('.btn-delete').forEach(button => {
    button.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Бул пикирди өчүрүүнү каалайсызбы?")) {
        try {
          button.disabled = true;
          await deleteDoc(doc(db, "feedbacks", id));
          alert("Пикир ийгиликтүү өчүрүлдү!");
        } catch (err) {
          console.error(err);
          button.disabled = false;
        }
      }
    };
  });
}