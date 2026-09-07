import 'dotenv/config';
import Fastify from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot, InlineKeyboard } from 'grammy';

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://coin-bitusd.onrender.com';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = new Map();
const TASKS = [
  { id:'tap100', icon:'👆', title:'100 тапов', desc:'Сделай 100 тапов', goal:100, reward:500 },
  { id:'tap1000', icon:'⚡', title:'1 000 тапов', desc:'Набери 1 000 тапов', goal:1000, reward:3000 },
  { id:'daily3', icon:'🎁', title:'Серия входов', desc:'Получи бонус 3 дня подряд', goal:3, reward:1500 },
  { id:'ref1', icon:'👥', title:'Пригласи друга', desc:'Пригласи 1 активного друга', goal:1, reward:1000 }
];

function newUser(id, ref = null) {
  return { id, coins:0, energy:1000, maxEnergy:1000, tapPower:1, lastEnergyAt:Date.now(),
    dailyStreak:0, lastDaily:null, taps:0, claimedTasks:[], referrals:[], referrer:ref && ref!==id?ref:null };
}
function getUser(id, ref=null) {
  if(!users.has(id)) {
    const u=newUser(id,ref); users.set(id,u);
    if(u.referrer && users.has(u.referrer)) { const r=users.get(u.referrer); r.referrals.push(id); r.coins += 1000; }
  }
  return users.get(id);
}
function restoreEnergy(u){const now=Date.now();const elapsed=Math.floor((now-u.lastEnergyAt)/1000);if(elapsed>0){u.energy=Math.min(u.maxEnergy,u.energy+elapsed*3);u.lastEnergyAt=now}}
function dayKey(){return new Date().toISOString().slice(0,10)}
function yesterdayKey(){const d=new Date();d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
function dailyReward(streak){return [100,150,250,400,650,1000,2500][Math.min(Math.max(streak,1),7)-1]}
function taskState(u){
  const streak=u.dailyStreak;
  return TASKS.map(t=>{
    let progress=0;
    if(t.id==='tap100'||t.id==='tap1000') progress=u.taps;
    if(t.id==='daily3') progress=streak;
    if(t.id==='ref1') progress=u.referrals.length;
    return {...t,progress,done:progress>=t.goal,claimed:u.claimedTasks.includes(t.id)};
  });
}
function leaderboard(id){
  const u=getUser(id); const seed=[
    {name:'BITUSD Whale',points:12840},{name:'CoinMaster',points:10920},{name:'Satoshi Hamster',points:8740},{name:'GoldTap',points:7200},{name:'BitRunner',points:6150}
  ];
  const all=[...seed,{name:'Ты',points:u.taps*u.tapPower}].sort((a,b)=>b.points-a.points);
  return {list:all.slice(0,10),rank:all.findIndex(x=>x.name==='Ты')+1,points:u.taps*u.tapPower};
}
function publicState(u){
  restoreEnergy(u); const today=dayKey(); const streakForToday=u.lastDaily===today?u.dailyStreak:u.dailyStreak;
  const board=leaderboard(u.id);
  return {id:u.id,coins:Math.floor(u.coins),energy:Math.floor(u.energy),maxEnergy:u.maxEnergy,tapPower:u.tapPower,
    upgradePrice:Math.floor(50*Math.pow(1.7,u.tapPower-1)),referrals:u.referrals.length,dailyStreak:streakForToday,
    dailyClaimed:u.lastDaily===today,dailyReward:dailyReward(u.lastDaily===today?u.dailyStreak:Math.min(u.dailyStreak+1,7)),lastDailyReward:dailyReward(u.dailyStreak),taps:u.taps,
    tasks:taskState(u),tournamentPoints:board.points,rank:board.rank,leaderboard:board.list,
    refLink:`https://t.me/CoinBitUSD_bot?start=ref_${u.id}`};
}

async function file(reply,name,type){try{return reply.type(type).send(await fs.readFile(path.join(__dirname,name)))}catch{return reply.code(404).send({error:'file not found'})}}
app.get('/',async(_r,reply)=>file(reply,'index.html','text/html; charset=utf-8'));
app.get('/style.css',async(_r,reply)=>file(reply,'style.css','text/css; charset=utf-8'));
app.get('/src.js',async(_r,reply)=>file(reply,'src.js','application/javascript; charset=utf-8'));
app.get('/logo.svg',async(_r,reply)=>file(reply,'logo.svg','image/svg+xml'));
app.get('/api/health',async()=>({ok:true,app:'Coin-BitUSD'}));
app.get('/api/state/:id',async(req)=>publicState(getUser(String(req.params.id))));
app.post('/api/tap',async(req,reply)=>{const id=String(req.body?.id||'');if(!id)return reply.code(400).send({error:'id required'});const u=getUser(id);restoreEnergy(u);const count=Math.max(1,Math.min(20,Number(req.body?.count||1)));const actual=Math.min(count,u.energy);if(actual<=0)return reply.code(400).send({error:'no energy'});u.energy-=actual;u.coins+=actual*u.tapPower;u.taps+=actual;return publicState(u)});
app.post('/api/upgrade',async(req,reply)=>{const u=getUser(String(req.body?.id||''));restoreEnergy(u);if(req.body?.type!=='tapPower')return reply.code(400).send({error:'unknown upgrade'});const price=Math.floor(50*Math.pow(1.7,u.tapPower-1));if(u.coins<price)return reply.code(400).send({error:'not enough coins'});u.coins-=price;u.tapPower+=1;return publicState(u)});
app.post('/api/daily',async(req,reply)=>{const u=getUser(String(req.body?.id||''));const today=dayKey();if(u.lastDaily===today)return reply.code(400).send({error:'Бонус уже получен сегодня'});if(u.lastDaily===yesterdayKey())u.dailyStreak=Math.min(u.dailyStreak+1,7);else u.dailyStreak=1;const reward=dailyReward(u.dailyStreak);u.lastDaily=today;u.coins+=reward;return publicState(u)});
app.post('/api/task/claim',async(req,reply)=>{const u=getUser(String(req.body?.id||''));const task=taskState(u).find(x=>x.id===req.body?.task);if(!task)return reply.code(404).send({error:'task not found'});if(task.claimed)return reply.code(400).send({error:'Награда уже получена'});if(!task.done)return reply.code(400).send({error:'Задание ещё не выполнено'});u.claimedTasks.push(task.id);u.coins+=task.reward;return publicState(u)});

if(BOT_TOKEN){
  const bot=new Bot(BOT_TOKEN);
  bot.command('start',async ctx=>{const payload=ctx.match?.trim()||'';const ref=payload.startsWith('ref_')?payload.slice(4):null;getUser(String(ctx.from.id),ref);const keyboard=new InlineKeyboard().webApp('🎮 ИГРАТЬ В COIN-BITUSD',WEBAPP_URL);await ctx.reply('🪙 Добро пожаловать в Coin-BitUSD!\n\nТапай, выполняй задания, забирай 7-дневные бонусы и соревнуйся в турнире.',{reply_markup:keyboard})});
  bot.command('ref',async ctx=>{await ctx.reply(`👥 Твоя реферальная ссылка:\nhttps://t.me/CoinBitUSD_bot?start=ref_${ctx.from.id}`)});
  bot.catch(err=>console.error(err));
  bot.start();
}else console.warn('BOT_TOKEN is not set. Bot will not start.');

app.listen({port:PORT,host:'0.0.0.0'}).catch(err=>{app.log.error(err);process.exit(1)});
