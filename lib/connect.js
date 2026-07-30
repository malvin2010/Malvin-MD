const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const readline = require('readline');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const config = require('./../config');
const { serialize } = require('./serialize');
const { handleMessage, loadCommands } = require('./commandHandler');
const { resolveChannel } = require('./channelForward');
const { sendText } = require('./sendMsg');

const logger = pino({ level: 'silent' });

function question(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

async function startBot({ onPairingCode, onReady, phoneNumber } = {}) {
  const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: config.PAIRING_METHOD === 'qr',
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['Malvin MD', 'Chrome', '120.0.0'],
    generateHighQualityLinkPreview: true,
  });

  loadCommands();

  // ----- Pairing code flow (used by both CLI and the web dashboard) -----
  if (config.PAIRING_METHOD === 'code' && !sock.authState.creds.registered) {
    const number = phoneNumber || config.BOT_NUMBER || (await question('Enter WhatsApp number (with country code, no +): '));
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''));
        console.log(chalk.green.bold(`\nYour Malvin MD pairing code: ${code}\n`));
        if (onPairingCode) onPairingCode(code);
      } catch (e) {
        console.error('Failed to request pairing code:', e.message);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && config.PAIRING_METHOD === 'qr') {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red(`Connection closed. Reconnecting: ${shouldReconnect}`));
      if (shouldReconnect) {
        startBot({ onPairingCode, onReady, phoneNumber });
      }
    } else if (connection === 'open') {
      console.log(chalk.green.bold(`✅ ${config.BOT_NAME} connected successfully!`));
      await resolveChannel(sock);

      // Try to follow the official channel automatically for the bot account itself
      try {
        const { INVITE_CODE } = require('./channelForward');
        await sock.newsletterFollow(INVITE_CODE ? `${INVITE_CODE}` : undefined).catch(() => {});
      } catch (e) {}

      if (onReady) onReady(sock);
    }
  });

  // ----- New user auto-join channel prompt -----
  sock.ev.on('messaging-history.set', async ({ isLatest }) => {
    // no-op hook reserved for first-sync tasks
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const raw of messages) {
      if (!raw.message) continue;
      const m = serialize(raw, sock);
      try {
        await handleMessage(sock, m);
      } catch (e) {
        console.error('handleMessage error:', e);
      }
    }
  });

  // Send every newly connected number the channel link automatically
  sock.ev.on('creds.update', async () => {
    if (sock.authState.creds.registered && !sock.__welcomedOnce) {
      sock.__welcomedOnce = true;
      const ownJid = sock.user?.id;
      if (ownJid) {
        try {
          await sendText(
            sock,
            ownJid,
            `🎉 *${config.BOT_NAME} is now connected!*\n\nYou have been linked to our official channel:\n${config.CHANNEL_LINK}\n\nType *.menu* to see all commands.`,
            null
          );
        } catch (e) {}
      }
    }
  });

  return sock;
}

module.exports = { startBot };
