    // Оң жакты бөгөттөө
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
  document.addEventListener('copy', e => e.preventDefault());

  
    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if (sidebar) sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    }

    function openCat(categoryId) {
        window.location.href = "index.html?cat=" + categoryId;
    }

    // БӨЛҮШҮҮ ФУНКЦИЯСЫ (АКЫРКЫ ТЕХНОЛОГИЯ МЕНЕН)
    async function shareApp() {
        // Эгер каптал меню ачык болсо, бөлүшүү терезеси чыкканда аны көмүскөдө жаап коёбуз
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }

        const shareData = {
            title: 'Кара-Көл Маркет',
            text: 'Кара-Көл шаарынын онлайн базары. Сиз дагы кирип жарнама бериңиз же керектүү нерсеңизди табыңыз!',
            url: window.location.origin + '/index.html' // Негизги башкы бетке багытталган шилтеме
        };

        try {
            // Эгер телефондо же заманбап браузерде иштесе (атайын системалык менюну ачат)
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Компьютерде же эски браузерде автоматтык түрдө шилтемени көчүрүп алат
                await navigator.clipboard.writeText(shareData.url);
                alert("Сайттын шилтемеси көчүрүлдү! Каалаган адамга жөнөтсөңүз болот.");
            }
        } catch (err) {
            console.log('Бөлүшүү токтотулду же ката кетти:', err);
        }
    }