
    // Оң жакты бөгөттөө
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Көчүрүүнү бөгөттөө (Ctrl+C же контексттик көчүрүү)
  document.addEventListener('copy', e => e.preventDefault());

  
    let globalRates = {}; 

    async function fetchLiveCurrency() {
      const tableBody = document.getElementById('rates-table');
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        
        if (data.result === "success") {
          const apiRates = data.rates;
          
          const kgsInUsd = apiRates.KGS || 89.50; 
          const currentUSD = kgsInUsd;

          const currentEUR = currentUSD / apiRates.EUR;
          const currentRUB = currentUSD / apiRates.RUB;
          const currentKZT = currentUSD / apiRates.KZT;

          globalRates = {
            USD: { 
              buy: (currentUSD * 0.993).toFixed(2), 
              sell: (currentUSD * 1.004).toFixed(2) 
            },
            EUR: { 
              buy: (currentEUR * 0.991).toFixed(2), 
              sell: (currentEUR * 1.007).toFixed(2) 
            },
            RUB: { 
              buy: (currentRUB * 0.965).toFixed(2), 
              sell: (currentRUB * 1.025).toFixed(2) 
            },
            KZT: { 
              buy: (currentKZT * 0.920).toFixed(2), 
              sell: (currentKZT * 1.060).toFixed(2) 
            }
          };

          tableBody.innerHTML = `
            <tr>
              <td><div class="currency-name"><span class="fi fi-us"></span> USD (АКШ Доллары)</div></td>
              <td class="price-buy">${globalRates.USD.buy} сом</td>
              <td class="price-sell">${globalRates.USD.sell} сом</td>
            </tr>
            <tr>
              <td><div class="currency-name"><span class="fi fi-eu"></span> EUR (Евро)</div></td>
              <td class="price-buy">${globalRates.EUR.buy} сом</td>
              <td class="price-sell">${globalRates.EUR.sell} сом</td>
            </tr>
            <tr>
              <td><div class="currency-name"><span class="fi fi-ru"></span> RUB (Орусия Рубли)</div></td>
              <td class="price-buy">${globalRates.RUB.buy} сом</td>
              <td class="price-sell">${globalRates.RUB.sell} сом</td>
            </tr>
            <tr>
              <td><div class="currency-name"><span class="fi fi-kz"></span> KZT (Казак Теңгеси)</div></td>
              <td class="price-buy">${globalRates.KZT.buy} сом</td>
              <td class="price-sell">${globalRates.KZT.sell} сом</td>
            </tr>
          `;

          const now = new Date();
          document.getElementById('sync-clock').innerText = `Акыркы жаңылоо: ${now.toLocaleTimeString('ky-KG')} (Айыл Банк убактысы)`;
          
          calculateConversion();
        }
      } catch (error) {
        console.error("Ката:", error);
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ff4d4d; padding: 20px;">Маалыматты жүктөө мүмкүн болгон жок. Интернетти текшериңиз.</td></tr>';
      }
    }

    function calculateConversion() {
      const amount = parseFloat(document.getElementById('inputAmount').value) || 0;
      const selectedCurrency = document.getElementById('fromCurrency').value;
      
      if (globalRates[selectedCurrency]) {
        const rate = parseFloat(globalRates[selectedCurrency].sell);
        const result = (amount * rate).toFixed(2);
        document.getElementById('outputAmount').value = result;
      }
    }

    document.getElementById('inputAmount').addEventListener('input', calculateConversion);
    document.getElementById('fromCurrency').addEventListener('change', calculateConversion);

    window.onload = fetchLiveCurrency;