const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  groups: path.join(DATA_DIR, 'groups.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  premium: path.join(DATA_DIR, 'premium.json'),
  stats: path.join(DATA_DIR, 'stats.json'),
};

function load(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return fallback;
  }
}

let users = load(FILES.users, {});
let groups = load(FILES.groups, {});
let settings = load(FILES.settings, { antilink: {}, welcome: {}, mute: {} });
let premium = load(FILES.premium, {});
let stats = load(FILES.stats, { commandsRun: 0, startedAt: Date.now(), perCommand: {} });

function save(key) {
  const map = { users, groups, settings, premium, stats };
  fs.writeFileSync(FILES[key], JSON.stringify(map[key], null, 2));
}

// ---------- USERS ----------
function getUser(jid) {
  if (!users[jid]) {
    users[jid] = {
      jid,
      balance: 500,
      bank: 0,
      xp: 0,
      level: 1,
      warns: 0,
      lastDaily: 0,
      lastWork: 0,
      registeredAt: Date.now(),
      commandsUsed: 0,
    };
    save('users');
  }
  return users[jid];
}

function updateUser(jid, patch) {
  const u = getUser(jid);
  Object.assign(u, patch);
  save('users');
  return u;
}

// ---------- GROUPS ----------
function getGroup(jid) {
  if (!groups[jid]) {
    groups[jid] = {
      jid,
      antilink: false,
      welcome: true,
      muted: false,
      warnings: {},
    };
    save('groups');
  }
  return groups[jid];
}

function updateGroup(jid, patch) {
  const g = getGroup(jid);
  Object.assign(g, patch);
  save('groups');
  return g;
}

// ---------- PREMIUM ----------
function isPremium(jid, ownerCheck) {
  if (ownerCheck) return true;
  const num = jid.split('@')[0];
  return !!premium[num];
}

function addPremium(number) {
  premium[number] = { since: Date.now() };
  save('premium');
}

function removePremium(number) {
  delete premium[number];
  save('premium');
}

// ---------- STATS ----------
function trackCommand(name) {
  stats.commandsRun += 1;
  stats.perCommand[name] = (stats.perCommand[name] || 0) + 1;
  save('stats');
}

module.exports = {
  getUser,
  updateUser,
  getGroup,
  updateGroup,
  isPremium,
  addPremium,
  removePremium,
  trackCommand,
  _raw: { users, groups, settings, premium, stats },
};
