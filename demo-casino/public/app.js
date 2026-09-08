const games=[
{name:'Gates of Olympus',slug:'gates',emoji:'⚡',tag:'x5000',cat:'popular',provider:'Pragmatic-style'},
{name:'The Dog House',slug:'dog',emoji:'🐕',tag:'x2500',cat:'popular',provider:'Pragmatic-style'},
{name:'Wild Bandito',slug:'bandito',emoji:'🤠',tag:'x4000',cat:'popular',provider:'Pragmatic-style'},
{name:'Sweet Bonanza',slug:'bonanza',emoji:'🍭',tag:'x21100',cat:'popular',provider:'Pragmatic-style'},
{name:'Treasures of Aztec',slug:'aztec',emoji:'💎',tag:'x5000',cat:'new',provider:'Originals'},
{name:'Big Bass Splash',slug:'bass',emoji:'🎣',tag:'x5000',cat:'new',provider:'Pragmatic-style'},
{name:'5 Wild Heart',slug:'heart',emoji:'❤️',tag:'x2500',cat:'new',provider:'Originals'},
{name:'Coin Volcano',slug:'volcano',emoji:'🌋',tag:'x3000',cat:'instant',provider:'Originals'},
{name:'Lucky Piggy',slug:'lucky',emoji:'🐷',tag:'x1800',cat:'popular',provider:'Arcana Lab'},
{name:'Mummyland Treasures',slug:'mummy',emoji:'🦂',tag:'x3200',cat:'popular',provider:'Originals'},
{name:'Wild Wild Riches',slug:'riches',emoji:'💰',tag:'x2200',cat:'new',provider:'Arcana Lab'},
{name:'Neon Starlight',slug:'neon',emoji:'✨',tag:'x3500',cat:'new',provider:'Arcana Lab'}
];
const symbols=['⚡','💎','👑','🔮','🪙','🐺','🍭','7️⃣'];
let balance=10000,bet=100,selected=games[0],filter='all',spins=0,bonusClaimed=false;
const grid=document.getElementById('grid'), search=document.getElementById('search'), provider=document.getElementById('provider'), balanceEl=document.getElementById('balance'),mini=document.getElementById('miniBalance'),betEl=document.getElementById('bet'),selectedEl=document.getElementById('selected'),reels=document.getElementById('reels'),result=document.getElementById('result'),spinBtn=document.getElementById('spin'),ticker=document.getElementById('ticker');
function fmt(n){return n.toLocaleString('ru-RU')}
function updateBalance(){balanceEl.textContent=fmt(balance);mini.textContent=fmt(balance);betEl.textContent=fmt(bet)}
function renderTicker(){ticker.innerHTML=[...games,...games].map((g,i)=>`<span class="ticker-item">${g.emoji} ${g.name} <b>+${(300+i*97).toLocaleString('ru-RU')} ◆</b></span>`).join('')}
function renderGrid(){const q=search.value.trim().toLowerCase(),p=provider.value;const list=games.filter(g=>(filter==='all'||g.cat===filter)&&(p==='all'||g.provider===p)&&g.name.toLowerCase().includes(q));grid.innerHTML=list.map(g=>`<article class="game-card" onclick="selectGame('${g.name.replace(/'/g,"\\'")}')"><div class="game-art ${g.slug}"><div class="art-emoji">${g.emoji}</div><div class="art-name">${g.name}</div><span class="tag">${g.tag}</span></div><div class="game-info"><div><b>${g.name}</b><span>${g.provider} · DEMO</span></div><button class="play">ИГРАТЬ</button></div></article>`).join('')||'<div style="grid-column:1/-1;color:#858b9b;padding:25px">Ничего не найдено</div>'}
function selectGame(name){selected=games.find(g=>g.name===name)||games[0];selectedEl.textContent=selected.name;renderReels();result.textContent='Демо-режим: виртуальные монеты';document.getElementById('demo').scrollIntoView({behavior:'smooth'});toast(`Открыта демо-игра: ${selected.name}`)}
function renderReels(values=symbols.slice(0,5)){reels.innerHTML=values.map(v=>`<div class="reel">${v}</div>`).join('')}
function changeBet(d){bet=Math.max(10,Math.min(1000,bet+d));if(balance<bet)bet=Math.max(10,Math.floor(balance/10)*10);updateBalance()}
function randomSymbol(){return symbols[Math.floor(Math.random()*symbols.length)]}
function spin(){if(spinBtn.disabled)return;if(balance<bet){result.textContent='Недостаточно виртуальных монет — забери бонус.';return}balance-=bet;spins++;updateBalance();spinBtn.disabled=true;result.textContent='Барабаны вращаются…';let ticks=0;const timer=setInterval(()=>{renderReels(Array.from({length:5},randomSymbol));ticks++;if(ticks>=11)clearInterval(timer)},70);setTimeout(()=>{const v=Array.from({length:5},randomSymbol);renderReels(v);const counts={};v.forEach(x=>counts[x]=(counts[x]||0)+1);const max=Math.max(...Object.values(counts));let win=max>=4?bet*20:max===3?bet*6:max===2?bet:0;balance+=win;updateBalance();result.innerHTML=win?`🎉 Выигрыш <strong>+${fmt(win)} ◆</strong>`:'Попробуй ещё раз — без реальных ставок';spinBtn.disabled=false},900)}
function claimBonus(){if(bonusClaimed)return toast('Бонус уже получен в этой сессии');balance+=500;bonusClaimed=true;updateBalance();toast('+500 виртуальных монет')}
function toast(t){const x=document.getElementById('toast');x.textContent=t;x.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>x.classList.remove('show'),2000)}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;document.getElementById('title').textContent=filter==='new'?'Новинки':filter==='popular'?'Популярное':filter==='all'?'Все игры':b.textContent;renderGrid()}));
search.addEventListener('input',renderGrid);provider.addEventListener('change',renderGrid);
renderTicker();renderGrid();updateBalance();renderReels();