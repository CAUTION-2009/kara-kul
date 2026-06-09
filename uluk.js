    // Оң жакты бөгөттөө
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
  document.addEventListener('copy', e => e.preventDefault());



  
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
  import { getFirestore, collection, getDocs, getDoc, doc as fsDoc, query, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCE6BOd8QJlHmo7cCDunwR20aC4eM6NvEA",
    authDomain: "kara-kul.firebaseapp.com",
    databaseURL: "https://kara-kul-default-rtdb.firebaseio.com",
    projectId: "kara-kul",
    storageBucket: "kara-kul.firebasestorage.app",
    messagingSenderId: "979298457663",
    appId: "1:979298457663:web:09969dc8007003cafc808a",
    measurementId: "G-ML2BEMNR3Z"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let textToCopy = ""; // Көчүрүлө турган текстти сактоочу глобалдык өзгөрмө

  
  const categoryNames = {
    'all': 'Баардыгы', 'news': 'Кабарлар', 'auto': 'Автоунаа', 'house': 'Кыймылсыз мүлк',
    'phone': 'Телефондор', 'construction': 'Курулуш материалдар', 'job': 'Жумуш', 'food': 'Тамак-аш',
    'tech': 'Техника', 'farm': 'Дыйкан-чарба', 'livestock': 'Мал чарба', 'sport': 'Спорт',
    'game': 'Киберспорт', 'taxi': 'Такси', 'fuel': 'Отун, көмүр', 'kitchen': 'Кофе, Ашкана',
    'tools': 'Аспаптар', 'beauty': 'Сулуулук', 'furniture': 'Табылга', 'charity': 'Кайрымдуулук'
  };

  function formatRelativeDate(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (compareDate.getTime() === today.getTime()) return `Бүгүн, ${timeStr}`;
    if (compareDate.getTime() === yesterday.getTime()) return `Кечээ, ${timeStr}`;
    
    const kgMonths = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    return `${date.getDate()} ${kgMonths[date.getMonth()]}, ${timeStr}`;
  }

  window.toggleMenu = function() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('overlay');
      if (sidebar) sidebar.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
  }

  window.currentImageIndexes = window.currentImageIndexes || {};
  window.nextImg = function(adId, imagesJson, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    let images = [];
    try { images = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson; } catch(e) { return; }
    if (!images || images.length <= 1) return;
    if (window.currentImageIndexes[adId] === undefined) window.currentImageIndexes[adId] = 0;
    window.currentImageIndexes[adId] = (window.currentImageIndexes[adId] + 1) % images.length;
    const nextIdx = window.currentImageIndexes[adId];
    const imgElement = document.getElementById(`img-${adId}`);
    const countSpan = document.getElementById(`count-${adId}`);
    if (imgElement) imgElement.src = images[nextIdx];
    if (countSpan) countSpan.innerText = `${nextIdx + 1}/${images.length}`;
  };

  window.showAdDetails = function(adId, imagesJson, categoryLabel, price, valuta, text, phone, waLink, views, dateStr) {
    let images = [];
    try { images = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson; } catch(e) { images = ["https://via.placeholder.com/150"]; }
    window.currentImageIndexes[`detail-${adId}`] = 0;
    const adModal = document.getElementById('adModal');
    const adOverlay = document.getElementById('adOverlay');

    adModal.innerHTML = `
        <div style="background: white; padding: 15px; display: flex; align-items: center; justify-content: space-between; font-weight: bold; font-size: 16px; border-bottom: 1px solid #eee;">
            <span style="color:#333;">Жарнама толук көрүнүшү</span>
            <i class="fas fa-times" onclick="closeAdDetails()" style="cursor: pointer; padding: 5px; font-size: 22px; color: #888;"></i>
        </div>
        <div style="flex: 1; overflow-y: auto; padding-bottom: 80px;">
            <div style="position: relative; width: 100%; height: 260px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img id="img-detail-${adId}" src="${images[0]}" style="width: 100%; height: 180%; object-fit: contain;">
                ${images.length > 1 ? `
                    <div id="badge-detail-${adId}" onclick="nextImg('detail-${adId}', ${JSON.stringify(images).replace(/"/g, '&quot;')}, event)" 
                         style="position: absolute; bottom: 15px; right: 15px; background: rgba(0, 0, 0, 0.7); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; z-index: 99; display: flex; align-items: center; justify-content: center; user-select: none;">
                         <span id="count-detail-${adId}">1/${images.length}</span> <i class="fas fa-chevron-right" style="font-size: 9px; margin-left: 6px;"></i>
                    </div>
                ` : ''}
            </div>
            <div style="padding: 20px; background: white;">
                <div style="font-size: 12px; color: #007bff; font-weight: bold; margin-bottom: 5px;">${categoryLabel}</div>
                <div style="font-size: 24px; color: #ff4d4d; font-weight: bold; margin-bottom: 12px;">${price} ${valuta}</div>
                <h2 style="font-size: 16px; color: #333; font-weight: normal; line-height: 1.5; margin-bottom: 25px; word-break: break-word;">${text}</h2>
                <div style="display: flex; gap: 25px; color: #999; font-size: 12px; border-top: 1px solid #f0f0f0; padding-top: 15px;">
                    <span><i class="far fa-eye"></i> ${views} жолу көрүлдү</span>
                    <span><i class="far fa-clock"></i> ${dateStr}</span>
                </div>
            </div>
        </div>
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: white; border-top: 1px solid #eee; padding: 12px; display: flex; gap: 10px; box-sizing: border-box; z-index: 3600;">
            <a href="tel:${phone}" style="text-decoration: none; background: #007bff; color: white; flex: 1; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fas fa-phone-alt"></i> Чалуу
            </a>
            <a href="${waLink}" target="_blank" style="text-decoration: none; background: #25D366; color: white; flex: 1; text-align: center; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
        </div>
    `;
    adModal.style.display = 'flex';
    adOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
  };

  window.closeAdDetails = function() {
    document.getElementById('adModal').style.display = 'none';
    document.getElementById('adOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Жабылганда даректеги ?id=... параметрин өчүрүп салат
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
  };

  window.filterAds = function(category, element) {
    window.closeAdDetails();
    const items = document.querySelectorAll('.cat-item');
    items.forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    const ads = document.querySelectorAll('.ad-card');
    let count = 0;
    ads.forEach(ad => {
      const adCategory = ad.getAttribute('data-category');
      if (category === 'all' || adCategory === category) { ad.style.display = 'flex'; count++; } else { ad.style.display = 'none'; }
    });

    const adsContainer = document.getElementById('adsList');
    const existingMsg = document.getElementById('emptyMsg');
    if (existingMsg) existingMsg.remove();
    if (count === 0 && adsContainer) {
      const msg = document.createElement('p'); msg.id = 'emptyMsg'; msg.style.cssText = "grid-column: 1/-1; text-align: center; color: #999; padding: 20px;";
      msg.innerText = "Бул бөлүмдө азырынча жарнама жок"; adsContainer.appendChild(msg);
    }
  };

  function checkUrlParamAndFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat'); 
    if (catParam) {
        const activeCatButton = document.querySelector(`.cat-item[onclick*="'${catParam}'"]`);
        window.filterAds(catParam, activeCatButton);
    }
  }

  // ----------------------------------------------------
  // БӨЛҮШҮҮ ТЕРЕЗЕСИНИН ФУНКЦИЯЛАРЫ (СҮРӨТТӨГҮДӨЙ)
  // ----------------------------------------------------
  function openShareModal(title, displayUrl, fullTextToCopy) {
    document.getElementById("shareModalTitle").innerText = title;
    document.getElementById("shareLinkContainer").innerText = displayUrl;
    textToCopy = fullTextToCopy; 
    document.getElementById("shareModalOverlay").style.display = "flex";
  }

  window.closeShareModal = function() {
    document.getElementById("shareModalOverlay").style.display = "none";
  };

  function showToast(message) {
    const toast = document.getElementById("customToast");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 2000);
  }

  window.executeCopy = function() {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed"; 
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        window.closeShareModal();
        showToast("Шилтеме көчүрүлдү!");
    } catch (err) {
        console.error("Ката:", err);
    }
    document.body.removeChild(textArea);
  };

  window.shareAd = function(adId, title, price, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${adId}`;
    const fullText = `${title} — Баасы: ${price}. Кененирээк шилтемеде: ${shareUrl}`;
    const cleanDisplayUrl = `${window.location.host}${window.location.pathname}?id=${adId}`;
    
    openShareModal("Толук шилтеме", cleanDisplayUrl, fullText);
  };

  window.shareMainSite = function(event) {
    if (event) { event.preventDefault(); }
    window.toggleMenu(); 
    const shareUrl = window.location.origin + window.location.pathname;
    const fullText = `Кара-Көл Маркет — Жарнамалар сайты. Сиз дагы кирип көрүңүз: ${shareUrl}`;
    const cleanDisplayUrl = window.location.host + window.location.pathname;
    
    openShareModal("Толук шилтеме", cleanDisplayUrl, fullText);
  };

  // ----------------------------------------------------
  // ШИЛТЕМЕ АРКЫЛУУ КИРГЕНДЕ ЖАРНАМАНЫ АВТОМАТТЫК ТҮРДӨ АЧУУ
  // ----------------------------------------------------
  async function checkDirectAdLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');
    
    if (adId) {
        try {
            const docRef = fsDoc(db, "ads", adId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const ad = docSnap.data();
                const categoryID = ad.category || 'all';
                const categoryLabel = categoryNames[categoryID] || 'Башка';
                const text = ad.title || ad.adText || "Аталышы жок";
                const price = ad.price || ad.adPrice || "0";
                const valuta = ad.currency || ad.adValuta || "сом";
                const phone = ad.phone || ad.adPhone || "";
                const views = ad.views || 0;
                const dateStr = formatRelativeDate(ad.createdAt);
                const allImages = ad.images || (ad.image || ad.img ? [ad.image || ad.img] : ["https://via.placeholder.com/150"]);
                const waPhone = phone.replace(/\D/g, ''); 
                const waLink = `https://wa.me/${waPhone}?text=Саламатсызбы!`;

                // Көрүү санын көбөйтүү
                await updateDoc(docRef, { views: increment(1) });

                // Модалдык терезени дароо ачуу
                window.showAdDetails(adId, JSON.stringify(allImages), categoryLabel, price, valuta, text, phone, waLink, views + 1, dateStr);
            }
        } catch (e) {
            console.error("Түз шилтемени жүктөөдө ката кетти:", e);
        }
    }
  }

  async function getAds() {
    const adsContainer = document.getElementById('adsList');
    if (!adsContainer) return;
    try {
        const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        adsContainer.innerHTML = ''; 
        if(querySnapshot.empty) {
            adsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Азырынча эч кандай жарнама жок.</p>'; return;
        }
        querySnapshot.forEach((doc) => {
            const ad = doc.data(); const adId = doc.id; const categoryID = ad.category || 'all'; const categoryLabel = categoryNames[categoryID] || 'Башка';
            const text = ad.title || ad.adText || "Аталышы жок"; const price = ad.price || ad.adPrice || "0"; const valuta = ad.currency || ad.adValuta || "сом";
            const phone = ad.phone || ad.adPhone || ""; const views = ad.views || 0; const dateStr = formatRelativeDate(ad.createdAt);
            const allImages = ad.images || (ad.image || ad.img ? [ad.image || ad.img] : ["https://via.placeholder.com/150"]);
            const waPhone = phone.replace(/\D/g, ''); const waLink = `https://wa.me/${waPhone}?text=Саламатсызбы!`;

            const adCard = document.createElement('div'); adCard.className = "ad-card"; adCard.setAttribute('data-category', categoryID); adCard.style.cursor = "pointer";
            adCard.onclick = async function(event) {
                if (event.target.closest('a') || event.target.closest('[id^="badge-"]') || event.target.closest('.share-btn')) return;
                
                // Карточканы басканда дарекке ID кошуп коюу
                const url = new URL(window.location.href);
                url.searchParams.set('id', adId);
                window.history.pushState({}, '', url);

                try { await updateDoc(fsDoc(db, "ads", adId), { views: increment(1) }); } catch (e) {}
                window.showAdDetails(adId, JSON.stringify(allImages), categoryLabel, price, valuta, text, phone, waLink, views + 1, dateStr);
            };

            adCard.innerHTML = `
                <div style="position: relative; overflow: hidden; height: 300px; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                    <img id="img-${adId}" src="${allImages[0]}" style="width: 100%; height: 200%; object-fit: contain;">
                    ${allImages.length > 1 ? `
                        <div id="badge-${adId}" onclick="nextImg('${adId}', ${JSON.stringify(allImages).replace(/"/g, '&quot;')}, event)" 
                             style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; cursor: pointer; z-index: 10; user-select: none;">
                             <span id="count-${adId}">1/${allImages.length}</span> <i class="fas fa-chevron-right" style="font-size: 7px;"></i>
                        </div>
                    ` : ''}
                </div>
                <div class="ad-info">
                    <div>
                        <div class="ad-price">${price} ${valuta}</div>
                        <h4>${text}</h4>
                    </div>
                    <div class="ad-meta">
                        <div><span><i class="far fa-eye"></i> ${views}</span><span style="margin-left: 5px;"><i class="far fa-clock"></i> ${dateStr}</span></div>
                        <button class="share-btn" onclick="shareAd('${adId}', '${text.replace(/'/g, "\\'")}', '${price} ${valuta}', event)" title="Бөлүшүү">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            adsContainer.appendChild(adCard);
        });
        checkUrlParamAndFilter();
        
        // Жарнамалар тизмеси даяр болгондо, даректе түз шилтеме келгенби текшерет
        checkDirectAdLink();

    } catch (error) {
        console.error("Ката кетти: ", error); adsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Маалыматты жүктөөдө ката кетти.</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchText = e.target.value.toLowerCase(); const ads = document.querySelectorAll(".ad-card");
        ads.forEach(ad => {
          const h4Element = ad.querySelector("h4"); const priceElement = ad.querySelector(".ad-price");
          const adTitle = h4Element ? h4Element.innerText.toLowerCase() : ""; const adPrice = priceElement ? priceElement.innerText.toLowerCase() : "";
          if (adTitle.includes(searchText) || adPrice.includes(searchText)) { ad.style.display = "flex"; } else { ad.style.display = "none"; }
        });
      });
    }
  });

  window.onload = getAds;