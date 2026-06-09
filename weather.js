
    // Оң жакты бөгөттөө
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
  document.addEventListener('copy', e => e.preventDefault());



  
    const LAT = 41.6333;
    const LON = 72.6667;

    async function loadRealWeather() {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m&timezone=auto`);
        const data = await response.json();

        const currentTemp = Math.round(data.current.temperature_2m);
        document.getElementById('current-temp').innerText = `${currentTemp}°C`;
        document.getElementById('wind-speed').innerText = `${data.current.wind_speed_10m} км/с`;
        document.getElementById('humidity').innerText = `${data.current.relative_humidity_2m}%`;
        
        const code = data.current.weather_code;
        let statusText = "Ачык асман";
        if (code > 0 && code <= 3) statusText = "Ала булуттуу";
        if (code >= 45 && code <= 48) statusText = "Тумандуу";
        if (code >= 51 && code <= 67) statusText = "Жамгыр жаажтат";
        if (code >= 71 && code <= 77) statusText = "Кар жаажтат";
        if (code >= 80) statusText = "Нөшөрлөгөн жамгыр";
        document.getElementById('weather-status').innerText = statusText;

        const hourlyTimes = data.hourly.time.slice(12, 19).map(t => t.split('T')[1]);
        const hourlyTemps = data.hourly.temperature_2m.slice(12, 19);
        buildChart(hourlyTimes, hourlyTemps);

      } catch (error) {
        console.error("Аба ырайын жүктөөдө ката:", error);
        document.getElementById('weather-status').innerText = "Ката кетти, кайра аракет кылыңыз";
      }
    }

    function buildChart(labels, temps) {
      const ctx = document.getElementById('weatherChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: temps,
            borderColor: '#ff4d4d',
            backgroundColor: 'rgba(255, 77, 77, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { display: true }, x: { grid: { display: false } } }
        }
      });
    }

    window.onload = loadRealWeather;