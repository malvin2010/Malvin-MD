const config = require('../config');
const db = require('../lib/database');
const { sendText } = require('../lib/sendMsg');

module.exports = [
  {
    name: 'broadcast',
    aliases: ['bc'],
    category: 'Owner',
    owner: true,
    desc: 'Broadcast a message to every known chat',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .broadcast <message>', m.key);
      const jids = Object.keys(db._raw.users);
      let sent = 0;
      for (const jid of jids) {
        try { await sendText(sock, jid, `📢 *Broadcast from ${config.CREATOR}*\n\n${text}`, null); sent++; } catch (e) {}
      }
      await sendText(sock, m.chat, `✅ Broadcast sent to ${sent} chats.`, m.key);
    },
  },
  {
    name: 'addprem',
    aliases: ['addpremium'],
    category: 'Owner',
    owner: true,
    desc: 'Grant a user premium access',
    async run(sock, m, args) {
      if (!args[0]) return sendText(sock, m.chat, 'Usage: .addprem 2637xxxxxxx', m.key);
      const number = args[0].replace(/[^0-9]/g, '');
      db.addPremium(number);
      await sendText(sock, m.chat, `💎 ${number} is now a premium user.`, m.key);
    },
  },
  {
    name: 'delprem',
    aliases: ['delpremium', 'rmprem'],
    category: 'Owner',
    owner: true,
    desc: 'Revoke a user premium access',
    async run(sock, m, args) {
      if (!args[0]) return sendText(sock, m.chat, 'Usage: .delprem 2637xxxxxxx', m.key);
      const number = args[0].replace(/[^0-9]/g, '');
      db.removePremium(number);
      await sendText(sock, m.chat, `✅ Removed premium from ${number}.`, m.key);
    },
  },
  {
    name: 'listprem',
    aliases: ['premiumusers'],
    category: 'Owner',
    owner: true,
    desc: 'List all premium users',
    async run(sock, m) {
      const nums = Object.keys(db._raw.premium);
      await sendText(sock, m.chat, `💎 *Premium Users (${nums.length})*\n\n${nums.join('\n') || 'None yet.'}`, m.key);
    },
  },
  {
    name: 'ban',
    aliases: [],
    category: 'Owner',
    owner: true,
    desc: 'Ban a user from using the bot',
    async run(sock, m, args) {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
      if (!target) return sendText(sock, m.chat, 'Mention, reply, or give a number to ban.', m.key);
      db.updateUser(target, { banned: true });
      await sendText(sock, m.chat, `🚫 Banned @${target.split('@')[0]} from using ${config.BOT_NAME}.`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'unban',
    aliases: [],
    category: 'Owner',
    owner: true,
    desc: 'Unban a user',
    async run(sock, m, args) {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
      if (!target) return sendText(sock, m.chat, 'Mention, reply, or give a number to unban.', m.key);
      db.updateUser(target, { banned: false });
      await sendText(sock, m.chat, `✅ Unbanned @${target.split('@')[0]}.`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'setbio',
    aliases: [],
    category: 'Owner',
    owner: true,
    desc: "Change the bot's WhatsApp bio",
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .setbio <new bio text>', m.key);
      await sock.updateProfileStatus(text);
      await sendText(sock, m.chat, '✅ Bio updated.', m.key);
    },
  },
  {
    name: 'join',
    aliases: ['joingroup'],
    category: 'Owner',
    owner: true,
    desc: 'Make the bot join a group via invite link',
    async run(sock, m, args) {
      if (!args[0]) return sendText(sock, m.chat, 'Usage: .join <group invite link>', m.key);
      const code = args[0].split('/').pop();
      try {
        await sock.groupAcceptInvite(code);
        await sendText(sock, m.chat, '✅ Joined the group.', m.key);
      } catch (e) {
        await sendText(sock, m.chat, `❌ Could not join: ${e.message}`, m.key);
      }
    },
  },
  {
    name: 'stats',
    aliases: ['botstats'],
    category: 'Owner',
    owner: true,
    desc: 'Show bot usage statistics',
    async run(sock, m) {
      const s = db._raw.stats;
      const top = Object.entries(s.perCommand).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([name, count], i) => `${i + 1}. ${name} - ${count} uses`).join('\n');
      await sendText(sock, m.chat, `📊 *${config.BOT_NAME} Stats*\n\nTotal commands run: ${s.commandsRun}\nRegistered users: ${Object.keys(db._raw.users).length}\n\n*Top commands:*\n${top}`, m.key);
    },
  },
  {
    name: 'block',
    aliases: [],
    category: 'Owner',
    owner: true,
    desc: 'Block a user on WhatsApp',
    async run(sock, m, args) {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
      if (!target) return sendText(sock, m.chat, 'Mention, reply, or give a number to block.', m.key);
      await sock.updateBlockStatus(target, 'block');
      await sendText(sock, m.chat, `🚫 Blocked ${target.split('@')[0]}`, m.key);
    },
  },
  {
    name: 'unblock',
    aliases: [],
    category: 'Owner',
    owner: true,
    desc: 'Unblock a user on WhatsApp',
    async run(sock, m, args) {
      if (!args[0]) return sendText(sock, m.chat, 'Usage: .unblock 2637xxxxxxx', m.key);
      const target = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
      await sock.updateBlockStatus(target, 'unblock');
      await sendText(sock, m.chat, `✅ Unblocked ${args[0]}`, m.key);
    },
  },
  {
    name: 'restart',
    aliases: [],
    category: 'Owner',
    owner: true,
    desc: 'Restart the bot process',
    async run(sock, m) {
      await sendText(sock, m.chat, '🔄 Restarting...', m.key);
      process.exit(0); // process manager (pm2/render/railway) should auto-restart
    },
  },
];
