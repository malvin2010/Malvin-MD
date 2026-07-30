const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('./database');
const { suggestCommand } = require('./typoCorrect');
const { sendText } = require('./sendMsg');

const commands = new Map(); // name -> command object
const aliasMap = new Map(); // alias -> primary name

function isOwner(sender) {
  const num = sender.split('@')[0];
  return config.OWNER_NUMBERS.includes(num);
}

function loadCommands() {
  commands.clear();
  aliasMap.clear();
  const dir = path.join(__dirname, '..', 'commands');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    delete require.cache[require.resolve(path.join(dir, file))];
    const list = require(path.join(dir, file));
    for (const cmd of list) {
      commands.set(cmd.name, cmd);
      (cmd.aliases || []).forEach((a) => aliasMap.set(a, cmd.name));
    }
  }
  return commands;
}

function resolve(name) {
  if (commands.has(name)) return commands.get(name);
  if (aliasMap.has(name)) return commands.get(aliasMap.get(name));
  return null;
}

function allNames() {
  return [...commands.keys(), ...aliasMap.keys()];
}

function getPrefix(text) {
  return config.PREFIXES.find((p) => text.startsWith(p)) || null;
}

async function handleMessage(sock, m) {
  if (!m.body || m.fromMe) return;
  const prefix = getPrefix(m.body.trim());
  if (!prefix) return;

  const withoutPrefix = m.body.trim().slice(prefix.length).trim();
  if (!withoutPrefix) return;

  const [rawCmd, ...args] = withoutPrefix.split(/\s+/);
  const cmdName = rawCmd.toLowerCase();
  const text = args.join(' ');

  let command = resolve(cmdName);

  // ----- Malvin AI typo correction -----
  if (!command) {
    const match = suggestCommand(cmdName, allNames());
    if (match && match.suggestion) {
      await sendText(
        sock,
        m.chat,
        `🤖 *Malvin AI*\nI think you meant *${prefix}${match.suggestion}* instead of *${prefix}${cmdName}*.\nRunning it for you now...`,
        m.key
      );
      command = resolve(match.suggestion);
    } else {
      return; // not a real command and nothing close enough - stay silent
    }
  }

  const senderIsOwner = isOwner(m.sender);
  const senderIsPremium = db.isPremium(m.sender, senderIsOwner);

  // ----- permission gates -----
  if (command.owner && !senderIsOwner) {
    return sendText(sock, m.chat, '🚫 This command is restricted to the bot owner.', m.key);
  }

  if (command.group && !m.isGroup) {
    return sendText(sock, m.chat, '🚫 This command only works inside groups.', m.key);
  }

  if (command.premium && !senderIsPremium) {
    return sendText(
      sock,
      m.chat,
      `💎 *${config.BOT_NAME} Premium Required*\n\n*${prefix}${command.name}* is a premium command.\nContact the owner to get premium access and unlock all ${commands.size}+ commands.\n\nOwner: wa.me/${config.OWNER_NUMBERS[0]}`,
      m.key
    );
  }

  if (command.groupAdmin && m.isGroup) {
    // real admin check is performed at command level using groupMetadata,
    // this flag just documents intent for menu display
  }

  try {
    db.getUser(m.sender).commandsUsed += 1;
    db.trackCommand(command.name);
    await command.run(sock, m, args, { text, isOwner: senderIsOwner, isPremium: senderIsPremium, prefix });
  } catch (err) {
    console.error(`[CMD ERROR] ${command.name}:`, err);
    await sendText(sock, m.chat, `⚠️ *${config.BOT_NAME}* hit an error running *${command.name}*:\n${err.message}`, m.key);
  }
}

module.exports = { loadCommands, resolve, allNames, handleMessage, isOwner, commands, aliasMap };
