const tg = window.Telegram?.WebApp;
tg?.ready(); tg?.expand();

const params = new URLSearchParams(location.search);
const tgUser = tg?.initDataUnsafe?.user;
const id = String(tgUser?.id || params.get('id') || 'demo');
const API='';
const app=document.querySelector('#app');
let state={coins:0,energy:1000,maxEnergy:1000,tapPower:1,upgradePrice:50,referrals:0,dailyStreak:0,dailyClaimed:false,dailyReward:100,taps:0,tasks:[]};
let active='home';

app.innerHTML=`<main class="app">
  <header class="header"><img class="brand-logo" src="/logo.svg"><div><div class="brand-name">Coin-BitUSD</div><div class="brand-sub">Тапай • выполняй • побеждай</div></div></header>
  <section class="balance"><div class="balance-left"><div class="coin-mini">₿</div><div><div class="label">Твой баланс</div><div id="coins" class="coins">0</div></div></div><div id="energyPill" class="energy-pill">⚡ 1000/1000</div></section>
  <div id="content"></div>
</main>
<nav class="bottom"><div class="nav">
 <button data-tab="home" class="active"><span>🏠</span>Главная</button>
 <button data-tab="tasks"><span>✓</span>Задания</button>
 <button data-tab="daily"><span>🎁</span>7 дней</button>
 <button data-tab="tournament"><span>🏆</span>Турниры</button>
 <button data-tab="ref"><span>👥</span>Рефералы</button>
</div></nav><div id="notice" class="notice"></div>`;

const content=document.querySelector('#content');
const coinsEl=document.querySelector('#coins'); const energyPill=document.querySelector('#energyPill'); const notice=document.querySelector('#notice');
const navBtns=[...document.querySelectorAll('[data-tab]')];

async function api(path,options={}){const r=await fetch(API+path,{headers:{'content-type':'application/json'},...options});const d=await r.json();if(!r.ok)throw new Error(d.error||'Ошибка');return d}
function show(text){notice.textContent=text;notice.classList.add('show');clearTimeout(show.t);show.t=setTimeout(()=>notice.classList.remove('show'),1800)}
function renderHeader(){coinsEl.textContent=Number(state.coins||0).toLocaleString('ru-RU');energyPill.textContent=`⚡ ${Math.floor(state.energy||0)}/${state.maxEnergy||1000}`}
function render(){renderHeader();navBtns.forEach(b=>b.classList.toggle('active',b.dataset.tab===active));
 if(active==='home')renderHome(); if(active==='tasks')renderTasks(); if(active==='daily')renderDaily(); if(active==='tournament')renderTournament(); if(active==='ref')renderRef();}
function renderHome(){const pct=Math.max(0,Math.min(100,(state.energy/state.maxEnergy)*100));content.innerHTML=`
 <section class="hero"><div class="season">● BITUSD SEASON 1 <b>LIVE</b></div><div class="coin-stage"><button id="tap" class="main-coin">₿</button></div><div class="tap-hint">Нажимай на Coin-BitUSD · +${state.tapPower} за тап</div><div class="energybar"><div class="energyfill" style="width:${pct}%"></div></div><div class="quick-grid"><button class="quick" id="upgradeBtn"><strong>🚀 x${state.tapPower}</strong>Сила тапа</button><button class="quick" id="dailyQuick"><strong>🎁 +${state.dailyReward}</strong>7-дневный вход</button><button class="quick" id="taskQuick"><strong>✓ ${state.tasks.filter(x=>x.done).length}/${state.tasks.length}</strong>Задания</button></div></section>
 <section class="section"><div class="section-title"><span>Сегодня</span><span>твои активности</span></div><div class="cards"><div class="card"><div class="row"><div class="row-left"><div class="iconbox">🏆</div><div><div class="card-title">Турнир Coin-BitUSD</div><div class="card-sub">Набирай очки тапами и попадай в топ</div></div></div><button class="action secondary" id="tourQuick">Открыть</button></div></div></div></section>`;
 document.querySelector('#tap').onclick=tap; document.querySelector('#upgradeBtn').onclick=upgrade; document.querySelector('#dailyQuick').onclick=()=>{active='daily';render()}; document.querySelector('#taskQuick').onclick=()=>{active='tasks';render()}; document.querySelector('#tourQuick').onclick=()=>{active='tournament';render()};}
function renderTasks(){content.innerHTML=`<section class="section"><div class="section-title"><span>Задания</span><span>забирай награды</span></div><div class="cards">${state.tasks.map(t=>`<div class="card"><div class="row"><div class="row-left"><div class="iconbox">${t.icon}</div><div><div class="card-title">${t.title}</div><div class="card-sub">${t.desc}</div></div></div><button class="action" data-task="${t.id}" ${t.claimed||!t.done?'disabled':''}>+${t.reward}</button></div><div class="progress"><div style="width:${Math.min(100,t.progress/t.goal*100)}%"></div></div><div class="card-sub">${Math.min(t.progress,t.goal)} / ${t.goal}</div></div>`).join('')}</div></section>`;content.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>claimTask(b.dataset.task));}
function renderDaily(){const rewards=[100,150,250,400,650,1000,2500];content.innerHTML=`<section class="section"><div class="card"><div class="row"><div><div class="label">Серия входов</div><div class="coins">${state.dailyStreak}/7 🔥</div><div class="card-sub">Заходи каждый день и забирай всё больше BITUSD</div></div><button id="claimDaily" class="action" ${state.dailyClaimed?'disabled':''}>${state.dailyClaimed?'Получено':'Забрать +' + state.dailyReward}</button></div><div class="streak">${rewards.map((r,i)=>`<div class="day ${i<state.dailyStreak?'claimed ':''}${i===state.dailyStreak&&!state.dailyClaimed?'today':''}"><b>День ${i+1}</b>${r}</div>`).join('')}</div></div></section>`;document.querySelector('#claimDaily').onclick=claimDaily;}
function renderTournament(){const list=state.leaderboard||[];content.innerHTML=`<section class="section"><div class="card"><div class="row"><div><div class="label">Турнир недели</div><div class="coins">🏆 ${state.tournamentPoints||0}</div><div class="card-sub">Очки = твои тап-очки за сезон</div></div><div class="rank">#${state.rank||'-'}</div></div></div></section><section class="section"><div class="section-title"><span>Таблица лидеров</span><span>обновляется</span></div><div class="card">${list.map((x,i)=>`<div class="leader"><div class="place">${i+1}</div><div class="avatar">${i<3?['🥇','🥈','🥉'][i]:'👤'}</div><div class="leader-name">${x.name}</div><div class="leader-score">${Number(x.points).toLocaleString('ru-RU')}</div></div>`).join('')}</div></section>`;}
function renderRef(){const link=state.refLink||`https://t.me/CoinBitUSD_bot?start=ref_${id}`;content.innerHTML=`<section class="section"><div class="card"><div class="row"><div><div class="label">Твоя команда</div><div class="coins">👥 ${state.referrals}</div><div class="card-sub">Приглашай друзей и получай бонусы</div></div><button id="share" class="action">Пригласить</button></div><div class="refbox" style="margin-top:12px">${link}</div></div></section><section class="section"><div class="card"><div class="row"><div class="row-left"><div class="iconbox">💰</div><div><div class="card-title">Бонус за друга</div><div class="card-sub">+1 000 BITUSD за каждого активного реферала</div></div></div><b>+1000</b></div></div></section>`;document.querySelector('#share').onclick=shareRef;}

async function load(){try{state=await api('/api/state/'+id);render()}catch(e){show(e.message)}}
async function tap(){try{state=await api('/api/tap',{method:'POST',body:JSON.stringify({id,count:1})});renderHeader();const b=document.querySelector('#tap');if(b){b.animate([{transform:'scale(1)'},{transform:'scale(.94)'},{transform:'scale(1)'}],{duration:120})}tg?.HapticFeedback?.impactOccurred('light')}catch(e){show('⚡ Энергия закончилась')}}
async function upgrade(){try{state=await api('/api/upgrade',{method:'POST',body:JSON.stringify({id,type:'tapPower'})});show(`🚀 Сила тапа x${state.tapPower}`);render()}catch(e){show(`Нужно ${state.upgradePrice} BITUSD`)}}
async function claimDaily(){try{state=await api('/api/daily',{method:'POST',body:JSON.stringify({id})});show(`🎁 +${state.lastDailyReward||state.dailyReward} BITUSD`);render()}catch(e){show(e.message)}}
async function claimTask(task){try{state=await api('/api/task/claim',{method:'POST',body:JSON.stringify({id,task})});show('✓ Награда получена');render()}catch(e){show(e.message)}}
async function shareRef(){const link=state.refLink||`https://t.me/CoinBitUSD_bot?start=ref_${id}`;try{if(navigator.share)await navigator.share({title:'Coin-BitUSD',text:'Заходи в Coin-BitUSD и получай BITUSD!',url:link});else await navigator.clipboard.writeText(link);show(navigator.share?'🚀 Ссылка отправлена':'📋 Ссылка скопирована')}catch(e){}}
navBtns.forEach(b=>b.onclick=()=>{active=b.dataset.tab;render()});
load();setInterval(load,8000);setInterval(()=>{if(active==='home')load()},20000);
