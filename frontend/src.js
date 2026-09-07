const API = ''; // если backend на другом домене: 'https://api.example.com'
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const params = new URLSearchParams(location.search);
const tgUser = tg?.initDataUnsafe?.user;
const id = String(tgUser?.id || params.get('id') || 'demo');

let state = {coins:0, energy:1000, maxEnergy:1000, tapPower:1, upgradePrice:50, referrals:0};

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="wrap">
    <div class="top">
      <div>
        <div class="small">ТВОЙ БАЛАНС</div>
        <div id="coins" class="coins">0 🪙</div>
      </div>
      <button id="daily">🎁 Daily</button>
    </div>

    <div class="card">
      <div class="hamster">🐹</div>
      <button id="tap" class="tap">TAP</button>
      <div class="energy">⚡ <span id="energy">1000</span> / <span id="maxEnergy">1000</span></div>
    </div>

    <div class="tabs">
      <button class="tab active">Главная</button>
      <button class="tab" id="upgrade">🚀 Улучшить</button>
      <button class="tab" id="ref">👥 Рефералы</button>
    </div>
    <div id="notice" class="notice"></div>
  </div>
`;

const coinsEl = document.querySelector('#coins');
const energyEl = document.querySelector('#energy');
const maxEnergyEl = document.querySelector('#maxEnergy');
const notice = document.querySelector('#notice');

function render() {
  coinsEl.textContent = `${state.coins.toLocaleString()} 🪙`;
  energyEl.textContent = Math.floor(state.energy);
  maxEnergyEl.textContent = state.maxEnergy;
}
async function api(path, options={}) {
  const r = await fetch(API + path, {
    headers: {'content-type':'application/json'},
    ...options
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка');
  return data;
}
function show(text) {
  notice.textContent = text;
  setTimeout(() => notice.textContent = '', 1800);
}

async function load() {
  try { state = await api(`/api/state/${id}`); render(); }
  catch(e) { show(e.message); }
}
document.querySelector('#tap').onclick = async () => {
  try {
    state = await api('/api/tap', {method:'POST', body:JSON.stringify({id,count:1})});
    render();
    tg?.HapticFeedback?.impactOccurred('light');
  } catch(e) { show(e.message); }
};
document.querySelector('#upgrade').onclick = async () => {
  try {
    state = await api('/api/upgrade', {method:'POST', body:JSON.stringify({id,type:'tapPower'})});
    render();
    show(`🚀 Сила тапа: x${state.tapPower}`);
  } catch(e) { show(`Нужно ${state.upgradePrice} 🪙`); }
};
document.querySelector('#daily').onclick = async () => {
  try {
    state = await api('/api/daily', {method:'POST', body:JSON.stringify({id})});
    render(); show('🎁 +500 монет!');
  } catch(e) { show('🎁 Бонус уже получен сегодня'); }
};
document.querySelector('#ref').onclick = () => {
  show(`👥 Приглашено: ${state.referrals}. Используй /ref в боте`);
};

load();
setInterval(load, 5000);
