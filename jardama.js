// Оң жакты бөгөттөө
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
  document.addEventListener('copy', e => e.preventDefault());



  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
  import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  let base64Images = { p1: "", p2: "", p3: "", p4: "", p5: "" };
  let currentUser = null;

  const authOverlay = document.getElementById('authOverlay');
  const userInfo = document.getElementById('userInfo');
  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const authError = document.getElementById('authError');

  // === GOOGLE АУТЕНТИФИКАЦИЯ ===

  // Колдонуучу абалын текшерүү
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      showUserInfo(user);
      authOverlay.style.display = 'none';
    } else {
      currentUser = null;
      hideUserInfo();
      authOverlay.style.display = 'flex';
    }
  }, (error) => {
    console.error("Auth state error:", error);
    showAuthError("Каттоо системасында ката: " + error.message);
  });

  function showAuthError(message) {
    authError.innerText = message;
    authError.style.display = 'block';
    console.error("Auth Error:", message);
  }

  // Google аркылуу каттоо
  googleSignInBtn.onclick = async () => {
    try {
      googleSignInBtn.disabled = true;
      googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Күтүү...';
      authError.style.display = 'none';

      console.log("Starting Google Sign-In...");
      console.log("Current domain:", window.location.origin);

      const result = await signInWithPopup(auth, provider);
      currentUser = result.user;
      console.log("Sign-in successful:", currentUser.email);
      showUserInfo(currentUser);
      authOverlay.style.display = 'none';

    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMsg = "Каттоодо ката кетти.";

      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = "Терезе жабылды. Кайра аракет кылыңыз.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = "Попап терезе бөгөттөлдү. Браузер жөндөөлөрүн текшериңиз.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = "Интернет байланышы жок. Текшериңиз.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = "Бул домен уруксат берилген эмес. Firebase Console'do Authorized domains текшериңиз.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = "Google Sign-In иштетилген эмес. Firebase Console'do Sign-in method табынан иштетиңиз.";
      } else if (error.code === 'auth/internal-error') {
        errorMsg = "Ички ката. Firebase проектинин жөндөөлөрүн текшериңиз.";
      } else if (error.code === 'auth/invalid-api-key') {
        errorMsg = "API Key туура эмес. Firebase конфигурациясын текшериңиз.";
      } else {
        errorMsg = "Ката: " + (error.message || "Белгисиз ката");
      }

      showAuthError(errorMsg + " Кайра аракет кылыңыз.");
    } finally {
      googleSignInBtn.disabled = false;
      googleSignInBtn.innerHTML = '<img src="https://www.google.com/favicon.ico" alt="Google" style="width: 18px; height: 18px;"> Google аркылуу кириңиз';
    }
  };

  function showUserInfo(user) {
    userPhoto.src = user.photoURL || 'https://via.placeholder.com/40';
    userName.innerText = user.displayName || 'Колдонуучу';
    userEmail.innerText = user.email || '';
    userInfo.style.display = 'flex';
  }

  function hideUserInfo() {
    userInfo.style.display = 'none';
  }

  window.signOutUser = async function() {
    try {
      await signOut(auth);
      currentUser = null;
      authOverlay.style.display = 'flex';
    } catch (error) {
      console.error("Чыгууда ката:", error);
    }
  };

  // === ТЕЛЕФОН ТЕКШЕРҮҮ ===

  const phoneInput = document.getElementById('adPhone');
  const phoneError = document.getElementById('phoneError');
  const submitBtn = document.getElementById('submitBtn');

  // КЫРГЫЗСТАНДЫН РАСМИЙ ОПЕРАТОРЛОРУНУН КОДДОРУН ТЕКШЕРҮҮ
  function validateKyrgyzPhone(phone) {
    let clean = phone.trim().replace(/[\s\-\(\)]/g, '');

    if (clean.startsWith('0') && clean.length === 10) {
      clean = '+996' + clean.substring(1);
    }

    if (clean.startsWith('996') && clean.length === 12) {
      clean = '+' + clean;
    }

    const formatRegex = /^\+996[0-9]{9}$/;
    if (!formatRegex.test(clean)) {
      return { isValid: false, msg: "Номер ката! Үлгү: 0700123456 же +996700123456" };
    }

    const code = clean.substring(4, 7);
    const mainNumber = clean.substring(4);

    if (/^(\d)\1{5,}/.test(mainNumber)) {
      return { isValid: false, msg: "Мындай фейк номерлерди жазууга болбойт!" };
    }

    const kgCodes = [
      '700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '500', '501', '502', '503', '504', '505', '507', '508', '509', '200', '201', '202', '203', '205',
      '550', '551', '552', '553', '554', '555', '556', '557', '559', '990', '995', '997', '998', '999',
      '770', '771', '772', '773', '774', '775', '776', '777', '778', '779', '220', '221', '222', '223', '224', '225', '227', '229',
      '880'
    ];

    if (!kgCodes.includes(code)) {
      return { isValid: false, msg: "Кыргызстанда мындай код катталган эмес: (" + code + ")" };
    }

    return { isValid: true, formatted: clean };
  }

  phoneInput.addEventListener('input', () => {
    const val = phoneInput.value.trim();

    if (val === "") {
      phoneInput.classList.remove('invalid-phone', 'valid-phone');
      phoneError.style.display = 'none';
      submitBtn.disabled = false;
      return;
    }

    const check = validateKyrgyzPhone(val);

    if (check.isValid) {
      phoneInput.classList.remove('invalid-phone');
      phoneInput.classList.add('valid-phone');
      phoneError.style.display = 'none';
      submitBtn.disabled = false;
    } else {
      phoneInput.classList.remove('valid-phone');
      phoneInput.classList.add('invalid-phone');
      phoneError.innerText = check.msg;
      phoneError.style.display = 'block';
      submitBtn.disabled = true;
    }
  });

  // === СҮРӨТ ЖҮКТӨӨ ===

  window.prev = function(input, n) {
    if (input.files && input.files[0]) {
      const file = input.files[0];

      let reader = new FileReader();
      reader.onload = function(e) {
        let img = document.getElementById('img' + n);
        if (img) {
          img.src = e.target.result;
          img.style.display = 'block';
        }
      }
      reader.readAsDataURL(file);

      const compressReader = new FileReader();
      compressReader.readAsDataURL(file);
      compressReader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 600; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
          base64Images['p' + n] = compressedBase64;
        };
      };
    }
  }

  // === ЖАРНАМА ЖӨНӨТҮҮ ===

  window.sendAd = async function() {
    // Катталганбы текшерүү
    if (!currentUser) {
      alert("Жарнама берүү үчүн катталыңыз!");
      authOverlay.style.display = 'flex';
      return;
    }

    const adText = document.getElementById('adText').value.trim();
    const adCat = document.getElementById('adCat').value;
    const adPrice = document.getElementById('adPrice').value.trim();
    const adValuta = document.getElementById('adValuta').value;
    const adPhone = phoneInput.value.trim();
    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');

    const finalCheck = validateKyrgyzPhone(adPhone);

    if (!finalCheck.isValid) {
      alert(finalCheck.msg);
      phoneInput.focus();
      return;
    }

    const uploadedUrls = [];
    for(let i = 1; i <= 5; i++) {
        if (base64Images['p' + i]) {
            uploadedUrls.push(base64Images['p' + i]);
        }
    }

    if (!adText || !adPrice || uploadedUrls.length === 0 || adCat === "none" || !adPhone) {
      alert("Сураныч, бардык талааларды толтуруңуз жана кеминде 1 сүрөт тандаңыз!");
      return;
    }

    btn.disabled = true;
    btnText.innerText = "Текшерүүгө жөнөтүлүүдө...";

    try {
      await addDoc(collection(db, "pending_ads"), {
        title: adText,
        category: adCat,
        price: adPrice,
        currency: adValuta,
        phone: finalCheck.formatted,
        image: uploadedUrls[0], 
        images: uploadedUrls,    
        createdAt: serverTimestamp(),
        views: 0,
        // Колдонуучу маалыматы
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Аноним',
        userEmail: currentUser.email,
        userPhoto: currentUser.photoURL || ''
      });

      alert("Жарнама модерацияга ийгиликтүү жөнөтүлдү! Админ текшергенден кийин сайтка чыгат.");
      window.location.href = 'index.html';

    } catch (error) {
      console.error("Ката кетти: ", error);
      alert("Ката кетти, кайра аракет кылыңыз: " + error.message);
      btnText.innerText = "Жарнаманы жайгаштыруу";
      btn.disabled = false;
    }
  }