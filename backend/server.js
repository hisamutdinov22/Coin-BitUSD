import 'dotenv/config';
import Fastify from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot, InlineKeyboard } from 'grammy';

const app = Fastify({ logger: true });
const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

async function sendFrontendFile(reply, filename, contentType) {
  try {
    const file = await fs.readFile(path.join(FRONTEND_DIR, filename));
    return reply.type(contentType).send(file);
  } catch {
    return reply.code(404).send({ error: 'frontend file not found' });
  }
}

app.get('/', async (_req, reply) =>
  sendFrontendFile(reply, 'index.html', 'text/html; charset=utf-8')
);

app.get('/style.css', async (_req, reply) =>
  sendFrontendFile(reply, 'style.css', 'text/css; charset=utf-8')
);

app.get('/src.js', async (_req, reply) =>
  sendFrontendFile(reply, 'src.js', 'application/javascript; charset=utf-8')
);

if (!BOT_TOKEN) console.warn('BOT_TOKEN is not set. Bot will not start.');

const users = new Map();

function getUser(id, ref = null) {
  if (!users.has(id)) {
    users.set(id, {
      id,
      coins: 0,
      energy: 1000,
      maxEnergy: 1000,
      tapPower: 1,
      lastEnergyAt: Date.now(),
      lastDaily: 0,
      referrals: [],
      referrer: ref && ref !== id ? ref : null
    });
    if (ref && ref !== id && users.has(ref)) users.get(ref).referrals.push(id);
  }
  return users.get(id);
}

function restoreEnergy(u) {
  const now = Date.now();
  const elapsed = Math.floor((now - u.lastEnergyAt) / 1000);
  if (elapsed > 0) {
    u.energy = Math.min(u.maxEnergy, u.energy + elapsed * 3);
    u.lastEnergyAt = now;
  }
}

app.get('/api/health', async () => ({ ok: true }));

app.get('/api/state/:id', async (req) => {
  const u = getUser(String(req.params.id));
  restoreEnergy(u);
  return publicState(u);
});

app.post('/api/tap', async (req, reply) => {
  const id = String(req.body?.id || '');
  const count = Math.max(1, Math.min(20, Number(req.body?.count || 1)));
  if (!id) return reply.code(400).send({ error: 'id required' });

  const u = getUser(id);
  restoreEnergy(u);
  const actual = Math.min(count, u.energy);
  u.energy -= actual;
  u.coins += actual * u.tapPower;
  return publicState(u);
});

app.post('/api/upgrade', async (req, reply) => {
  const id = String(req.body?.id || '');
  const type = req.body?.type;
  const u = getUser(id);
  restoreEnergy(u);

  if (type !== 'tapPower') return reply.code(400).send({ error: 'unknown upgrade' });
  const price = Math.floor(50 * Math.pow(1.7, u.tapPower - 1));
  if (u.coins < price) return reply.code(400).send({ error: 'not enough coins' });

  u.coins -= price;
  u.tapPower += 1;
  return publicState(u);
});

app.post('/api/daily', async (req, reply) => {
  const id = String(req.body?.id || '');
  const u = getUser(id);
  const today = new Date().toISOString().slice(0, 10);
  if (u.lastDaily === today) return reply.code(400).send({ error: 'already claimed' });

  u.lastDaily = today;
  u.coins += 500;
  return publicState(u);
});

function publicState(u) {
  return {
    id: u.id,
    coins: u.coins,
    energy: Math.floor(u.energy),
    maxEnergy: u.maxEnergy,
    tapPower: u.tapPower,
    upgradePrice: Math.floor(50 * Math.pow(1.7, u.tapPower - 1)),
    referrals: u.referrals.length
  };
}

if (BOT_TOKEN && WEBAPP_URL) {
  const bot = new Bot(BOT_TOKEN);

  bot.command('start', async (ctx) => {
    const payload = ctx.match?.trim() || '';
    const ref = payload.startsWith('ref_') ? payload.slice(4) : null;
    getUser(String(ctx.from.id), ref);

    const keyboard = new InlineKeyboard()
      .webApp('🎮 ИГРАТЬ', WEBAPP_URL);

    await ctx.reply(
      '🐹 Добро пожаловать в Coin Mini App!\\n\\n' +
      '👆 Тапай, зарабатывай монеты и прокачивай силу.',
      { reply_markup: keyboard }
    );
  });

  bot.command('ref', async (ctx) => {
    const link = `https://t.me/${bot.botInfo?.username}?start=ref_${ctx.from.id}`;
    await ctx.reply(`👥 Твоя реферальная ссылка:\\n${link}`);
  });

  bot.catch((err) => console.error(err));
  bot.start();
}

app.listen({ port: PORT, host: '0.0.0.0' });
