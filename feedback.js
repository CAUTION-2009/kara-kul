   // Оң жакты бөгөттөө
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
  document.addEventListener('copy', e => e.preventDefault());

  
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

    const badWords = ["котак", "сик", "ам", "гөт", "сука", "бля", "нах", "пидр", "далбай", "хрен", "хуй"];

    const emailInput = document.getElementById('feedbackEmail');
    const emailError = document.getElementById('emailError');
    const btnSubmit = document.getElementById('btnSubmit');

    // EMAIL ДАРЕКТИ ТАК ТЕКШЕРҮҮ ФУНКЦИЯСЫ
    function validateEmailAddress(email) {
      const trimmed = email.trim().toLowerCase();
      
      // Стандарттык почта форматын текшерүү
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(trimmed)) {
        return { isValid: false, msg: "Электрондук дарек форматы туура эмес (Мисалы: info@gmail.com)" };
      }

      // Доменди жана колдонуучунун атын бөлүү
      const parts = trimmed.split('@');
      const namePart = parts[0];
      const domainPart = parts[1];

      // Фейк аталыштарды текшерүү (мис: aaaaaa@mail.ru же 111111@gmail.com)
      if (/^(\w)\1{4,}/.test(namePart) || /^[0-9]{4,}$/.test(namePart)) {
        return { isValid: false, msg: "Сураныч, фейк эмес, реалдуу электрондук дарегиңизди жазыңыз!" };
      }

      // Белгилүү ишенимдүү домендерди текшерүү
      const trustedDomains = ['gmail.com', 'mail.ru', 'yandex.ru', 'bk.ru', 'list.ru', 'inbox.ru', 'icloud.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
      const hasValidExtension = trustedDomains.some(dom => domainPart === dom || domainPart.endsWith('.' + dom));
      
      if (!hasValidExtension && domainPart.split('.').pop().length < 2) {
        return { isValid: false, msg: "Мындай электрондук почта домени жараксыз!" };
      }

      return { isValid: true, cleaned: trimmed };
    }

    // ТАЛААНЫ РЕАЛДУУ УБАГЫНДА КӨЗӨМӨЛДӨӨ
    emailInput.addEventListener('input', () => {
      const val = emailInput.value.trim();
      
      if (val === "") {
        emailInput.classList.remove('invalid-input', 'valid-input');
        emailError.style.display = 'none';
        btnSubmit.disabled = false;
        return;
      }

      const check = validateEmailAddress(val);

      if (check.isValid) {
        emailInput.classList.remove('invalid-input');
        emailInput.classList.add('valid-input');
        emailError.style.display = 'none';
        btnSubmit.disabled = false;
      } else {
        emailInput.classList.remove('valid-input');
        emailInput.classList.add('invalid-input');
        emailError.innerText = check.msg;
        emailError.style.display = 'block';
        btnSubmit.disabled = true; // Ката болсо кнопка басылбайт
      }
    });

    window.sendFeedback = async function() {
      const textInput = document.getElementById('feedbackText');
      const email = emailInput.value.trim();
      const text = textInput.value.trim();
      
      const btn = document.getElementById('btnSubmit');
      const btnText = document.getElementById('btnText');

      if (!email || !text) {
        alert("Сураныч, бардык талааларды толтуруңуз!");
        return;
      }

      // Жөнөтүү алдында акыркы текшерүү
      const emailCheck = validateEmailAddress(email);
      if (!emailCheck.isValid) {
        alert(emailCheck.msg);
        emailInput.focus();
        return;
      }

      const lowerText = text.toLowerCase();
      const hasBadWord = badWords.some(word => lowerText.includes(word));

      if (hasBadWord) {
        alert("Ката! Сиздин билдирүүдө этикага жатпаган же уят сөздөр табылды. Мындай билдирүүлөр кабыл алынбайт!");
        return;
      }

      btn.disabled = true;
      btnText.innerText = "Жөнөтүлүүдө...";

      try {
        await addDoc(collection(db, "feedbacks"), {
          email: emailCheck.cleaned, // Базага тазаланган жана кичине тамгага өткөрүлгөн туура почта сакталат
          message: text,
          createdAt: serverTimestamp()
        });

        alert("Билдирүүңүз администраторго ийгиликтүү жөнөтүлдү. Рахмат!");
        emailInput.value = "";
        textInput.value = "";
        emailInput.classList.remove('valid-input', 'invalid-input');
      } catch (err) {
        console.error("Ката катталды: ", err);
        alert("Билдирүү жөнөтүүдө ката кетти. Интернетти текшерип, кайра аракет кылыңыз.");
      } finally {
        btn.disabled = false;
        btnText.innerText = "Жөнөтүү";
      }
    }