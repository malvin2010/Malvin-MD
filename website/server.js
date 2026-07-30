const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');

const config = require('../config');
const { serialize } = require('../lib/serialize');
const { handleMessage, loadCommands } = require('../lib/commandHandler');
const { resolveChannel, INVITE_CODE } = require('../lib/channelForward');
const { sendText } = require('../lib/sendMsg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const logger = pino({ level: 'silent' });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SESSIONS_DIR = path.join(__dirname, '..', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// Live stats tracked in memory for the dashboard
const stats = {
  activeNow: 0,
  totalPaired: 0,
  totalUsers: new Set(),
  capacity: 100,
};

const activeSockets = new Map(); // number -> sock

loadCommands();

async function pairNumber(number, socketId) {
  const dir = path.join(SESSIONS_DIR, number);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    browser: ['Malvin MD', 'Chrome', '120.0.0'],
  });

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''));
        io.to(socketId).emit('pairing-code', { code });
      } catch (e) {
        io.to(socketId).emit('pairing-error', { message: e.message });
      }
    }, 2000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      activeSockets.set(number, sock);
      stats.activeNow = activeSockets.size;
      stats.totalPaired += 1;
      stats.totalUsers.add(number);
      await resolveChannel(sock);
      try { await sock.newsletterFollow(INVITE_CODE); } catch (e) {}
      io.to(socketId).emit('paired', { number });
      io.emit('stats-update', publicStats());

      try {
        await sendText(
          sock,
          sock.user.id,
          `🎉 *${config.BOT_NAME} connected successfully!*\n\nYou're now linked to our official channel:\n${config.CHANNEL_LINK}\n\nType *.menu* to view all ${'123'} commands.`,
          null
        );
      } catch (e) {}
    }
    if (connection === 'close') {
      activeSockets.delete(number);
      stats.activeNow = activeSockets.size;
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        pairNumber(number, socketId); // auto-reconnect
      }
      io.emit('stats-update', publicStats());
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const raw of messages) {
      if (!raw.message) continue;
      const m = serialize(raw, sock);
      try { await handleMessage(sock, m); } catch (e) { console.error(e); }
    }
  });

  return sock;
}

function publicStats() {
  return {
    activeNow: stats.activeNow,
    totalPaired: stats.totalPaired,
    totalUsers: stats.totalUsers.size,
    capacity: Math.min(100, Math.round((stats.activeNow / stats.capacity) * 100)),
    capacityMax: stats.capacity,
  };
}

io.on('connection', (socket) => {
  socket.on('request-pair', async ({ number }) => {
    if (!number || number.length < 8) return socket.emit('pairing-error', { message: 'Invalid phone number' });
    try {
      await pairNumber(number.replace(/[^0-9]/g, ''), socket.id);
    } catch (e) {
      socket.emit('pairing-error', { message: e.message });
    }
  });
});

app.get('/api/stats', (req, res) => res.json(publicStats()));

app.get('/health', (req, res) => res.json({ status: 'ok', bot: config.BOT_NAME }));

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`🌐 ${config.BOT_NAME} pairing website running on port ${PORT}`);
});
