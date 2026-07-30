const config = require('../config');
const db = require('../lib/database');
const { sendText } = require('../lib/sendMsg');

async function requireAdmin(sock, m) {
  const meta = await sock.groupMetadata(m.chat);
  const participant = meta.participants.find((p) => p.id === m.sender);
  const botIsAdmin = meta.participants.find((p) => p.id === sock.user.id.split(':')[0] + '@s.whatsapp.net')?.admin;
  const senderIsAdmin = !!participant?.admin;
  return { meta, senderIsAdmin, botIsAdmin };
}

function targetFrom(m, args) {
  if (m.mentionedJid?.length) return m.mentionedJid[0];
  if (m.quoted?.sender) return m.quoted.sender;
  if (args[0]) return `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  return null;
}

module.exports = [
  {
    name: 'kick',
    aliases: ['remove'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Remove a member from the group (admin only)',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const target = targetFrom(m, args);
      if (!target) return sendText(sock, m.chat, 'Mention or reply to the user to kick.', m.key);
      await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
      await sendText(sock, m.chat, `✅ Removed @${target.split('@')[0]}`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'add',
    aliases: [],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Add a member to the group - .add 2637xxxxxxx',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      if (!args[0]) return sendText(sock, m.chat, 'Usage: .add 2637xxxxxxx', m.key);
      const number = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      await sock.groupParticipantsUpdate(m.chat, [number], 'add');
      await sendText(sock, m.chat, `✅ Added ${args[0]}`, m.key);
    },
  },
  {
    name: 'promote',
    aliases: ['admin'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Promote a member to admin',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const target = targetFrom(m, args);
      if (!target) return sendText(sock, m.chat, 'Mention or reply to the user to promote.', m.key);
      await sock.groupParticipantsUpdate(m.chat, [target], 'promote');
      await sendText(sock, m.chat, `⬆️ Promoted @${target.split('@')[0]}`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'demote',
    aliases: [],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Demote an admin to member',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const target = targetFrom(m, args);
      if (!target) return sendText(sock, m.chat, 'Mention or reply to the user to demote.', m.key);
      await sock.groupParticipantsUpdate(m.chat, [target], 'demote');
      await sendText(sock, m.chat, `⬇️ Demoted @${target.split('@')[0]}`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'tagall',
    aliases: ['everyone'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Tag every member in the group',
    async run(sock, m, args, { text }) {
      const meta = await sock.groupMetadata(m.chat);
      const mentions = meta.participants.map((p) => p.id);
      const list = meta.participants.map((p) => `@${p.id.split('@')[0]}`).join(' ');
      await sendText(sock, m.chat, `📢 *Tag All*\n${text ? text + '\n\n' : ''}${list}`, m.key, { mentionedJid: mentions });
    },
  },
  {
    name: 'hidetag',
    aliases: ['h'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Send a message that silently mentions everyone',
    async run(sock, m, args, { text }) {
      const meta = await sock.groupMetadata(m.chat);
      const mentions = meta.participants.map((p) => p.id);
      await sendText(sock, m.chat, text || '📢', m.key, { mentionedJid: mentions });
    },
  },
  {
    name: 'groupopen',
    aliases: ['unlock'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Allow all members to send messages',
    async run(sock, m) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      await sock.groupSettingUpdate(m.chat, 'not_announcement');
      await sendText(sock, m.chat, '🔓 Group opened - everyone can chat.', m.key);
    },
  },
  {
    name: 'groupclose',
    aliases: ['lock'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Only admins can send messages',
    async run(sock, m) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      await sock.groupSettingUpdate(m.chat, 'announcement');
      await sendText(sock, m.chat, '🔒 Group closed - only admins can chat.', m.key);
    },
  },
  {
    name: 'antilink',
    aliases: [],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Toggle automatic link removal - .antilink on/off',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const mode = args[0]?.toLowerCase();
      if (!['on', 'off'].includes(mode)) return sendText(sock, m.chat, 'Usage: .antilink on/off', m.key);
      db.updateGroup(m.chat, { antilink: mode === 'on' });
      await sendText(sock, m.chat, `🔗 Antilink turned *${mode.toUpperCase()}*`, m.key);
    },
  },
  {
    name: 'setname',
    aliases: ['gname'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Change the group name',
    async run(sock, m, args, { text }) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      if (!text) return sendText(sock, m.chat, 'Usage: .setname New Group Name', m.key);
      await sock.groupUpdateSubject(m.chat, text);
      await sendText(sock, m.chat, `✅ Group name changed to: ${text}`, m.key);
    },
  },
  {
    name: 'setdesc',
    aliases: ['gdesc'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Change the group description',
    async run(sock, m, args, { text }) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      if (!text) return sendText(sock, m.chat, 'Usage: .setdesc New description', m.key);
      await sock.groupUpdateDescription(m.chat, text);
      await sendText(sock, m.chat, '✅ Group description updated.', m.key);
    },
  },
  {
    name: 'groupinfo',
    aliases: ['ginfo'],
    category: 'Group',
    group: true,
    desc: 'Show group information',
    async run(sock, m) {
      const meta = await sock.groupMetadata(m.chat);
      const admins = meta.participants.filter((p) => p.admin).length;
      const text = `👥 *${meta.subject}*\n\nMembers: ${meta.participants.length}\nAdmins: ${admins}\nCreated: ${new Date(meta.creation * 1000).toDateString()}\nDescription: ${meta.desc || 'None'}`;
      await sendText(sock, m.chat, text, m.key);
    },
  },
  {
    name: 'listadmins',
    aliases: ['admins'],
    category: 'Group',
    group: true,
    desc: 'List all group admins',
    async run(sock, m) {
      const meta = await sock.groupMetadata(m.chat);
      const admins = meta.participants.filter((p) => p.admin);
      const mentions = admins.map((a) => a.id);
      const list = admins.map((a) => `@${a.id.split('@')[0]} (${a.admin})`).join('\n');
      await sendText(sock, m.chat, `👑 *Group Admins*\n\n${list}`, m.key, { mentionedJid: mentions });
    },
  },
  {
    name: 'grouplink',
    aliases: ['glink', 'invitelink'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Get the group invite link',
    async run(sock, m) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const code = await sock.groupInviteCode(m.chat);
      await sendText(sock, m.chat, `🔗 https://chat.whatsapp.com/${code}`, m.key);
    },
  },
  {
    name: 'revokelink',
    aliases: ['resetlink'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Reset the group invite link',
    async run(sock, m) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const code = await sock.groupRevokeInvite(m.chat);
      await sendText(sock, m.chat, `♻️ New invite link:\nhttps://chat.whatsapp.com/${code}`, m.key);
    },
  },
  {
    name: 'warn',
    aliases: [],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Warn a group member (3 warns = auto kick)',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const target = targetFrom(m, args);
      if (!target) return sendText(sock, m.chat, 'Mention or reply to the user to warn.', m.key);
      const g = db.getGroup(m.chat);
      g.warnings[target] = (g.warnings[target] || 0) + 1;
      db.updateGroup(m.chat, { warnings: g.warnings });
      const count = g.warnings[target];
      if (count >= 3) {
        await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
        g.warnings[target] = 0;
        db.updateGroup(m.chat, { warnings: g.warnings });
        return sendText(sock, m.chat, `⚠️ @${target.split('@')[0]} reached 3 warnings and was removed.`, m.key, { mentionedJid: [target] });
      }
      await sendText(sock, m.chat, `⚠️ @${target.split('@')[0]} warned (${count}/3)`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'unwarn',
    aliases: ['clearwarn'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Clear warnings for a member',
    async run(sock, m, args) {
      const { senderIsAdmin } = await requireAdmin(sock, m);
      if (!senderIsAdmin) return sendText(sock, m.chat, '🚫 Only group admins can use this.', m.key);
      const target = targetFrom(m, args);
      if (!target) return sendText(sock, m.chat, 'Mention or reply to the user.', m.key);
      const g = db.getGroup(m.chat);
      g.warnings[target] = 0;
      db.updateGroup(m.chat, { warnings: g.warnings });
      await sendText(sock, m.chat, `✅ Warnings cleared for @${target.split('@')[0]}`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'poll',
    aliases: ['vote'],
    category: 'Group',
    group: true,
    premium: true,
    desc: 'Create a poll - .poll Question | Option1 | Option2',
    async run(sock, m, args, { text }) {
      if (!text || !text.includes('|')) return sendText(sock, m.chat, 'Usage: .poll Question | Option1 | Option2', m.key);
      const [question, ...options] = text.split('|').map((s) => s.trim());
      await sock.sendMessage(m.chat, {
        poll: { name: question, values: options.slice(0, 12), selectableCount: 1 },
      }, { quoted: m.key });
    },
  },
  {
    name: 'leave',
    aliases: ['leavegroup'],
    category: 'Group',
    group: true,
    owner: true,
    desc: 'Make the bot leave the current group',
    async run(sock, m) {
      await sendText(sock, m.chat, '👋 Goodbye!', m.key);
      await sock.groupLeave(m.chat);
    },
  },
];
