const config = require('../config');
const db = require('../lib/database');
const { sendText, sendButtons } = require('../lib/sendMsg');
const { commands } = require('../lib/commandHandler');

module.exports = [
  {
    name: 'premium',
    aliases: ['vip'],
    category: 'Premium',
    desc: 'Check your premium status or how to get it',
    async run(sock, m) {
      const isOwner = config.OWNER_NUMBERS.includes(m.sender.split('@')[0]);
      const isPrem = db.isPremium(m.sender, isOwner);
      const premiumCount = [...commands.values()].filter((c) => c.premium).length;
      if (isPrem) {
        return sendText(sock, m.chat, `💎 *You are a Premium user!*\n\nYou have access to all ${premiumCount} premium commands including downloads, AI, converters and group tools.`, m.key);
      }
      const text = `🔒 *You are on the Free plan*\n\n${premiumCount} commands are premium-only.\nContact the owner to upgrade:\nwa.me/${config.OWNER_NUMBERS[0]}`;
      const buttons = [{ buttonId: `.report I want premium`, buttonText: { displayText: '💎 Request Premium' }, type: 1 }];
      await sendButtons(sock, m.chat, text, buttons, m.key);
    },
  },
  {
    name: 'premiumlist',
    aliases: ['premcmds'],
    category: 'Premium',
    desc: 'List every premium-only command',
    async run(sock, m) {
      const list = [...commands.values()].filter((c) => c.premium).map((c) => c.name);
      await sendText(sock, m.chat, `💎 *Premium Commands (${list.length})*\n\n${list.map((n) => `${config.PREFIXES[0]}${n}`).join(', ')}`, m.key);
    },
  },
  {
    name: 'freecommands',
    aliases: ['freecmds'],
    category: 'Premium',
    desc: 'List every free command',
    async run(sock, m) {
      const list = [...commands.values()].filter((c) => !c.premium).map((c) => c.name);
      await sendText(sock, m.chat, `🆓 *Free Commands (${list.length})*\n\n${list.map((n) => `${config.PREFIXES[0]}${n}`).join(', ')}`, m.key);
    },
  },
];
