/* ==========================================================================
   1. ИМПОРТТОР ЖАНА ИНИЦИАЛИЗАЦИЯ (Firebase & External Libraries)
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, doc, deleteDoc, getDoc, getDocs, 
  onSnapshot, serverTimestamp, query, orderBy, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE6BOd8QJlHmo7cCDunwR20aC4eM6NvEA",
  authDomain: "kara-kul.firebaseapp.com",
  projectId: "kara-kul",
  storageBucket: "kara-kul.firebasestorage.app",
  messagingSenderId: "979298457663",
  appId: "1:979298457663:web:09969dc8007003cafc808a",
  measurementId: "G-N6NSJ500J9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Глобалдык коопсуздук: Чычкандын оң баскычын жана көчүрүүнү бөгөттөө
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());

/* ==========================================================================
   2. ЖАЛПЫ ФУНКЦИЯЛАР (Каптал меню, Бөлүшүү ж.б.)
   ========================================================================== */
window.toggleMenu = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

window.openCat = function(categoryId) {
    window.location.href = "index.html?cat=" + categoryId;
}

window.shareApp = async function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    const shareData = {
        title: 'Кара-Көл Market',
        text: 'Кара-Көл шаарынын онлайн базары. Сиз дагы кирип жарнама бериңиз же керектүү нерсеңизди табыңыз!',
        url: window.location.origin + '/index.html'
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            alert("Шилтеме: " + shareData.url);
        }
    } catch (err) {
        console.log(err);
    }
}

/* ==========================================================================
   3. БАШКЫ БЕТ ЖАНА ЖАРНАМАЛАРДЫ КӨРСӨТҮҮ (uluk.js)
   ========================================================================== */
if (document.getElementById('ads-container') && !document.getElementById('admin-panel-flag')) {
    const categoryTranslations = {
        "phone": "Телефондор", "car": "Унаалар", "property": "Кыймылсыз мүлк",
        "clothes": "Кийим-кече", "job": "Жумуш орундары", "services": "Кызмат көрсөтүүлөр",
        "animals": "Мал-жандык", "household": "Үй тиричилик", "other": "Башкалар"
    };

    let textData = [];
    const adsContainer = document.getElementById("ads-container");

    const loadAds = async () => {
        try {
            const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            adsContainer.innerHTML = "";
            textData = [];

            if (querySnapshot.empty) {
                adsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Азырынча жарнама жок.</p>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const adId = docSnap.id;
                const text = data.title || "";
                const price = data.price || "Келишимдүү";
                const valuta = data.currency || "";
                const images = data.images || [];
                const phone = data.phone || "";
                const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('ky-KG') : "";
                const views = data.views || 0;

                textData.push({ id: adId, text: text, price: price });

                const mainImage = images.length > 0 ? images[0] : "placeholder.jpg";

                const adCard = document.createElement("div");
                adCard.className = "ad-card";
                adCard.innerHTML = `
                    <img src="${mainImage}" onclick="openAdModal('${adId}')" alt="img">
                    <div class="ad-info">
                        <div>
                            <div class="ad-price">${price} ${valuta}</div>
                            <h4 onclick="openAdModal('${adId}')">${text}</h4>
                        </div>
                        <div class="ad-meta">
                            <span><i class="fas fa-eye"></i> ${views} • ${date}</span>
                            <button class="share-btn" onclick="shareAd('${adId}', '${text.replace(/'/g, "\\'")}', '${price} ${valuta}', event)">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
                adsContainer.appendChild(adCard);
            });
            
            // URL параметрлерин текшерүү
            const urlParams = new URLSearchParams(window.location.search);
            const catParam = urlParams.get('cat');
            if (catParam) {
                const ads = document.querySelectorAll(".ad-card");
                // Бул жерге фильтр логикасын кошсоңуз болот
            }

        } catch (error) {
            console.error(error);
            adsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Маалыматты жүктөөдө ката кетти.</p>';
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        loadAds();
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const searchText = e.target.value.toLowerCase();
                const ads = document.querySelectorAll(".ad-card");
                ads.forEach(ad => {
                    const title = ad.querySelector("h4")?.innerText.toLowerCase() || "";
                    const price = ad.querySelector(".ad-price")?.innerText.toLowerCase() || "";
                    if (title.includes(searchText) || price.includes(searchText)) {
                        ad.style.display = "flex";
                    } else {
                        ad.style.display = "none";
                    }
                });
            });
        }
    });
}

/* ==========================================================================
   4. ЖАРНАМА КОШУУ (jardama.js)
   ========================================================================== */
if (document.getElementById('btnSubmitAd')) {
    let base64Images = { p1: "", p2: "", p3: "", p4: "", p5: "" };

    window.previewImage = function(input, boxId) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const box = document.getElementById(boxId);
                let img = box.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    box.appendChild(img);
                }
                img.src = e.target.result;
                img.style.display = 'block';
                base64Images[boxId] = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    document.getElementById('btnSubmitAd').onclick = async function() {
        const adText = document.getElementById('adText').value;
        const adCat = document.getElementById('adCat').value;
        const adPrice = document.getElementById('adPrice').value;
        const adValuta = document.getElementById('adValuta').value;
        const adPhone = document.getElementById('adPhone').value;

        const uploadedUrls = [];
        for(let i = 1; i <= 5; i++) {
            if (base64Images['p' + i]) uploadedUrls.push(base64Images['p' + i]);
        }

        if (!adText || !adPrice || uploadedUrls.length === 0 || adCat === "none" || !adPhone) {
            alert("Сураныч, бардык талааларды толтуруңуз жана кеминде 1 сүрөт тандаңыз!");
            return;
        }

        try {
            this.disabled = true;
            this.innerText = "Текшерүүгө жөнөтүлүүдө...";
            await addDoc(collection(db, "pending_ads"), {
                title: adText, category: adCat, price: adPrice,
                currency: adValuta, phone: adPhone, images: uploadedUrls,
                views: 0, createdAt: serverTimestamp()
            });
            alert("Жарнама текшерүүгө жөнөтүлдү!");
            window.location.href = "index.html";
        } catch (err) {
            console.error(err);
            this.disabled = false;
            this.innerText = "Кайра аракет кылуу";
        }
    };
}

/* ==========================================================================
   5. ПИКИР КЛЕНТТИК БӨЛҮГҮ (feedback.js)
   ========================================================================== */
if (document.getElementById('btnSendFeedback')) {
    document.getElementById('btnSendFeedback').onclick = async function() {
        const email = document.getElementById('fbEmail').value;
        const msg = document.getElementById('fbMessage').value;

        if (!email || !msg) {
            alert("Бардык талааларды толтуруңуз!");
            return;
        }

        try {
            this.disabled = true;
            await addDoc(collection(db, "feedbacks"), {
                email: email, message: msg, createdAt: serverTimestamp()
            });
            alert("Пикир жөнөтүлдү, рахмат!");
            document.getElementById('fbEmail').value = "";
            document.getElementById('fbMessage').value = "";
        } catch(err) {
            console.error(err);
        } finally {
            this.disabled = false;
        }
    };
}

/* ==========================================================================
   6. БАНК ЖАНА КУРС (Bank.js)
   ========================================================================== */
if (document.getElementById('rates-table')) {
    let globalRates = {};
    const fetchLiveCurrency = async () => {
        const tableBody = document.getElementById('rates-table');
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            if (data.result === "success") {
                const usd = data.rates.KGS || 89.50;
                globalRates = {
                    USD: { buy: (usd * 0.99).toFixed(2), sell: (usd * 1.01).toFixed(2) },
                    EUR: { buy: (usd / data.rates.EUR * 0.99).toFixed(2), sell: (usd / data.rates.EUR * 1.01).toFixed(2) },
                    RUB: { buy: (usd / data.rates.RUB * 0.99).toFixed(3), sell: (usd / data.rates.RUB * 1.01).toFixed(3) },
                    KZT: { buy: (usd / data.rates.KZT * 0.99).toFixed(3), sell: (usd / data.rates.KZT * 1.01).toFixed(3) }
                };

                tableBody.innerHTML = `
                    <tr><td>USD (Доллар)</td><td class="price-buy">${globalRates.USD.buy}</td><td class="price-sell">${globalRates.USD.sell}</td></tr>
                    <tr><td>EUR (Евро)</td><td class="price-buy">${globalRates.EUR.buy}</td><td class="price-sell">${globalRates.EUR.sell}</td></tr>
                    <tr><td>RUB (Рубль)</td><td class="price-buy">${globalRates.RUB.buy}</td><td class="price-sell">${globalRates.RUB.sell}</td></tr>
                    <tr><td>KZT (Теңге)</td><td class="price-buy">${globalRates.KZT.buy}</td><td class="price-sell">${globalRates.KZT.sell}</td></tr>
                `;
            }
        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="3">Ката кетти...</td></tr>';
        }
    };
    fetchLiveCurrency();
}

/* ==========================================================================
   7. АБА ЫРАЙЫ (weather.js)
   ========================================================================== */
if (document.getElementById('current-temp')) {
    const loadWeather = async () => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=41.6333&longitude=72.6667&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&timezone=auto`);
            const data = await res.json();
            document.getElementById('current-temp').innerText = `${Math.round(data.current.temperature_2m)}°C`;
            document.getElementById('humidity').innerText = `${data.current.relative_humidity_2m}%`;
            
            let status = "Ачык асман";
            if(data.current.weather_code > 0 && data.current.weather_code <= 3) status = "Ала булуттуу";
            if(data.current.weather_code >= 51) status = "Жамгыр/Кар";
            document.getElementById('weather-status').innerText = status;
        } catch (err) {
            console.error(err);
        }
    };
    loadWeather();
}

/* ==========================================================================
   8. АДМИН ПАНЕЛЬ (admin.js)
   ========================================================================== */
if (document.getElementById('admin-panel-flag')) {
    const ADMIN_PASSWORD = "ulii";
    
    window.checkPassword = function() {
        const pass = document.getElementById('adminPass').value;
        if (pass === ADMIN_PASSWORD) {
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('adminContainer').style.display = 'block';
            loadAdminData();
        } else {
            alert("Сөз туура эмес!");
        }
    };

    const loadAdminData = () => {
        // Кабыл алына турган жарнамаларды ушул жерден уксаңыз болот (onSnapshot менен)
        onSnapshot(collection(db, "pending_ads"), (snapshot) => {
            const container = document.getElementById('pending-ads-list');
            if(!container) return;
            container.innerHTML = "";
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const div = document.createElement('div');
                div.className = "feedback-card";
                div.innerHTML = `
                    <h3>${data.title}</h3>
                    <p>Баасы: ${data.price} ${data.currency}</p>
                    <button onclick="approveAd('${docSnap.id}')" class="btn btn-approve">Уруксат берүү</button>
                    <button onclick="deletePending('${docSnap.id}')" class="btn btn-delete">Өчүрүү</button>
                `;
                container.appendChild(div);
            });
        });
    };

    window.approveAd = async function(id) {
        const docRef = doc(db, "pending_ads", id);
        const snap = await getDoc(docRef);
        if(snap.exists()) {
            await addDoc(collection(db, "ads"), snap.data());
            await deleteDoc(docRef);
            alert("Жарнама ийгиликтүү кошулду!");
        }
    };

    window.deletePending = async function(id) {
        if(confirm("Өчүрөсүзбү?")) {
            await deleteDoc(doc(db, "pending_ads", id));
        }
    };
}