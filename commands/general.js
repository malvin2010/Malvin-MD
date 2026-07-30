const os = require('os');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const config = require('../config');
const db = require('../lib/database');
const { sendText, sendButtons, footer } = require('../lib/sendMsg');
const { commands } = require('../lib/commandHandler');

const MENU_IMAGE = path.join(__dirname, '..', 'assets', 'menu.png');

function fmtUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

function groupByCategory() {
  const map = {};
  for (const cmd of commands.values()) {
    if (!map[cmd.category]) map[cmd.category] = [];
    map[cmd.category].push(cmd.name);
  }
  return map;
}

module.exports = [
  {
    name: 'menu',
    aliases: ['help', 'commands'],
    category: 'General',
    desc: 'Show the full premium command menu',
    async run(sock, m) {
      const cats = groupByCategory();
      let text = `╭━━━「 *${config.BOT_NAME}* 」━━━╮\n`;
      text += `│ 👤 User: ${m.pushName}\n`;
      text += `│ 🕐 Time: ${moment().tz('Africa/Harare').format('HH:mm:ss')}\n`;
      text += `│ ⚙️ Prefix: ${config.PREFIXES.join(' ')}\n`;
      text += `│ 📦 Commands: ${commands.size}\n`;
      text += `│ 👑 Creator: ${config.CREATOR}\n`;
      text += `╰━━━━━━━━━━━━━━━╯\n\n`;

      for (const [cat, list] of Object.entries(cats)) {
        text += `┌─❒ *${cat.toUpperCase()}*\n`;
        for (const c of list) text += `│⦿ ${config.PREFIXES[0]}${c}\n`;
        text += `└───────────\n\n`;
      }

      const buttons = [
        { buttonId: '.ping', buttonText: { displayText: '⚡ Ping' }, type: 1 },
        { buttonId: '.alive', buttonText: { displayText: '🤖 Alive' }, type: 1 },
        { buttonId: '.premium', buttonText: { displayText: '💎 Premium' }, type: 1 },
      ];

      const imageBuffer = fs.existsSync(MENU_IMAGE) ? fs.readFileSync(MENU_IMAGE) : undefined;
      await sendButtons(sock, m.chat, text, buttons, m.key, imageBuffer);
    },
  },
  {
    name: 'ping',
    aliases: ['speed'],
    category: 'General',
    desc: 'Check bot response speed',
    async run(sock, m) {
      const start = Date.now();
      const sent = await sendText(sock, m.chat, '🏓 Pinging...', m.key);
      const latency = Date.now() - start;
      await sock.sendMessage(m.chat, { text: `⚡ *${latency}ms*\n${config.BOT_NAME} is fast and online.`, edit: sent.key });
    },
  },
  {
    name: 'alive',
    aliases: ['status'],
    category: 'General',
    desc: 'Check if the bot is alive',
    async run(sock, m) {
      const uptime = fmtUptime(process.uptime());
      await sendText(sock, m.chat, `✅ *${config.BOT_NAME} is alive!*\n\n⏱️ Uptime: ${uptime}\n💻 Platform: ${os.platform()}\n👑 Owner: ${config.OWNER_NUMBERS[0]}`, m.key);
    },
  },
  {
    name: 'owner',
    aliases: ['creator'],
    category: 'General',
    desc: 'Get the owner contact',
    async run(sock, m) {
      for (const num of config.OWNER_NUMBERS) {
        await sock.sendMessage(m.chat, {
          contacts: {
            displayName: config.CREATOR,
            contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${config.CREATOR}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD` }],
          },
        }, { quoted: m.key });
      }
    },
  },
  {
    name: 'botinfo',
    aliases: ['info', 'about'],
    category: 'General',
    desc: 'Full bot information',
    async run(sock, m) {
      const text = `🤖 *${config.BOT_NAME}*\n\nVersion: ${config.VERSION}\nCreator: ${config.CREATOR}\nCommands: ${commands.size}\nLibrary: Baileys (Multi-Device)\nChannel: ${config.CHANNEL_LINK}\n\nBuilt with real, working command handlers - no placeholders.`;
      await sendText(sock, m.chat, text, m.key);
    },
  },
  {
    name: 'runtime',
    aliases: ['uptime'],
    category: 'General',
    desc: 'Bot process uptime',
    async run(sock, m) {
      await sendText(sock, m.chat, `⏱️ Runtime: ${fmtUptime(process.uptime())}`, m.key);
    },
  },
  {
    name: 'jid',
    aliases: [],
    category: 'General',
    desc: 'Get the current chat JID',
    async run(sock, m) {
      await sendText(sock, m.chat, `📌 Chat JID:\n${m.chat}\n\n📌 Your JID:\n${m.sender}`, m.key);
    },
  },
  {
    name: 'profile',
    aliases: ['me', 'whoami'],
    category: 'General',
    desc: 'Show your bot profile stats',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      const text = `👤 *Your Profile*\n\nName: ${m.pushName}\nLevel: ${u.level}\nXP: ${u.xp}\nBalance: $${u.balance}\nBank: $${u.bank}\nCommands used: ${u.commandsUsed}\nMember since: ${moment(u.registeredAt).format('DD MMM YYYY')}`;
      await sendText(sock, m.chat, text, m.key);
    },
  },
  {
    name: 'report',
    aliases: ['bug'],
    category: 'General',
    desc: 'Report a bug to the owner',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, `Usage: .report <describe the bug>`, m.key);
      for (const num of config.OWNER_NUMBERS) {
        await sendText(sock, `${num}@s.whatsapp.net`, `🐞 *Bug Report*\n\nFrom: ${m.pushName} (${m.sender.split('@')[0]})\n\n${text}`, null);
      }
      await sendText(sock, m.chat, '✅ Your report has been sent to the owner. Thank you!', m.key);
    },
  },
  {
    name: 'donate',
    aliases: [],
    category: 'General',
    desc: 'Support the developer',
    async run(sock, m) {
      await sendText(sock, m.chat, `💝 *Support ${config.CREATOR}*\n\nIf ${config.BOT_NAME} has been useful, contact the owner directly to support development:\nwa.me/${config.OWNER_NUMBERS[0]}`, m.key);
    },
  },
  {
    name: 'script',
    aliases: ['sc', 'sourcecode'],
    category: 'General',
    desc: 'Get info about the bot source',
    async run(sock, m) {
      await sendText(sock, m.chat, `📜 *${config.BOT_NAME}* is a private multi-device bot built by ${config.CREATOR}.\nFor a copy, contact the owner: wa.me/${config.OWNER_NUMBERS[0]}`, m.key);
    },
  },
  {
    name: 'credits',
    aliases: ['cr'],
    category: 'General',
    desc: 'Show credits',
    async run(sock, m) {
      await sendText(sock, m.chat, `🏆 *Credits*\n\n${config.BOT_NAME} was built and is maintained by *${config.CREATOR}*.\nPowered by the Baileys multi-device library.`, m.key);
    },
  },
  {
    name: 'listcommands',
    aliases: ['cmdlist', 'allcmds'],
    category: 'General',
    desc: 'Flat list of every command name',
    async run(sock, m) {
      const names = [...commands.keys()].sort();
      await sendText(sock, m.chat, `📋 *All ${names.length} Commands*\n\n${names.map((n) => `${config.PREFIXES[0]}${n}`).join(', ')}`, m.key);
    },
  },
  {
    name: 'support',
    aliases: ['channel'],
    category: 'General',
    desc: 'Get the official channel link',
    async run(sock, m) {
      await sendText(sock, m.chat, `📢 *Official Channel*\n\nJoin here for updates, news and premium codes:\n${config.CHANNEL_LINK}`, m.key);
    },
  },
];
