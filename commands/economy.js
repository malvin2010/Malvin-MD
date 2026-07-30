const db = require('../lib/database');
const { sendText } = require('../lib/sendMsg');

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function targetFrom(m, args) {
  if (m.mentionedJid?.length) return m.mentionedJid[0];
  if (m.quoted?.sender) return m.quoted.sender;
  return null;
}

module.exports = [
  {
    name: 'balance',
    aliases: ['bal', 'wallet'],
    category: 'Economy',
    desc: 'Check your wallet and bank balance',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      await sendText(sock, m.chat, `💰 *Balance*\n\nWallet: $${u.balance}\nBank: $${u.bank}\nTotal: $${u.balance + u.bank}`, m.key);
    },
  },
  {
    name: 'daily',
    aliases: [],
    category: 'Economy',
    desc: 'Claim your daily reward',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      const now = Date.now();
      if (now - u.lastDaily < DAY_MS) {
        const left = DAY_MS - (now - u.lastDaily);
        const h = Math.floor(left / HOUR_MS);
        return sendText(sock, m.chat, `⏳ You already claimed your daily reward. Try again in ${h}h.`, m.key);
      }
      const reward = 1000;
      db.updateUser(m.sender, { balance: u.balance + reward, lastDaily: now });
      await sendText(sock, m.chat, `🎁 You claimed your daily reward of $${reward}!`, m.key);
    },
  },
  {
    name: 'work',
    aliases: ['job'],
    category: 'Economy',
    desc: 'Work to earn money (hourly cooldown)',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      const now = Date.now();
      if (now - u.lastWork < HOUR_MS) {
        const left = Math.ceil((HOUR_MS - (now - u.lastWork)) / 60000);
        return sendText(sock, m.chat, `⏳ You're tired. Rest for ${left} more minutes before working again.`, m.key);
      }
      const jobs = ['Uber driver', 'Software developer', 'Chef', 'Delivery rider', 'Teacher', 'Photographer'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earned = Math.floor(Math.random() * 400) + 100;
      db.updateUser(m.sender, { balance: u.balance + earned, lastWork: now });
      await sendText(sock, m.chat, `💼 You worked as a *${job}* and earned $${earned}!`, m.key);
    },
  },
  {
    name: 'deposit',
    aliases: ['dep'],
    category: 'Economy',
    desc: 'Deposit money into your bank',
    async run(sock, m, args) {
      const u = db.getUser(m.sender);
      const amount = args[0] === 'all' ? u.balance : parseInt(args[0]);
      if (!amount || amount <= 0 || amount > u.balance) return sendText(sock, m.chat, 'Usage: .deposit <amount|all>', m.key);
      db.updateUser(m.sender, { balance: u.balance - amount, bank: u.bank + amount });
      await sendText(sock, m.chat, `🏦 Deposited $${amount} into your bank.`, m.key);
    },
  },
  {
    name: 'withdraw',
    aliases: ['wd'],
    category: 'Economy',
    desc: 'Withdraw money from your bank',
    async run(sock, m, args) {
      const u = db.getUser(m.sender);
      const amount = args[0] === 'all' ? u.bank : parseInt(args[0]);
      if (!amount || amount <= 0 || amount > u.bank) return sendText(sock, m.chat, 'Usage: .withdraw <amount|all>', m.key);
      db.updateUser(m.sender, { balance: u.balance + amount, bank: u.bank - amount });
      await sendText(sock, m.chat, `🏧 Withdrew $${amount} from your bank.`, m.key);
    },
  },
  {
    name: 'transfer',
    aliases: ['give', 'pay'],
    category: 'Economy',
    group: true,
    desc: 'Transfer money to another user (mention or reply)',
    async run(sock, m, args) {
      const target = targetFrom(m, args);
      const amount = parseInt(args.find((a) => /^\d+$/.test(a)));
      if (!target || !amount) return sendText(sock, m.chat, 'Usage: .transfer <amount> (mention or reply to user)', m.key);
      const sender = db.getUser(m.sender);
      if (amount > sender.balance) return sendText(sock, m.chat, "❌ You don't have enough balance.", m.key);
      const receiver = db.getUser(target);
      db.updateUser(m.sender, { balance: sender.balance - amount });
      db.updateUser(target, { balance: receiver.balance + amount });
      await sendText(sock, m.chat, `✅ Transferred $${amount} to @${target.split('@')[0]}`, m.key, { mentionedJid: [target] });
    },
  },
  {
    name: 'gamble',
    aliases: ['bet'],
    category: 'Economy',
    desc: 'Gamble your money - 45% win chance',
    async run(sock, m, args) {
      const u = db.getUser(m.sender);
      const amount = parseInt(args[0]);
      if (!amount || amount <= 0 || amount > u.balance) return sendText(sock, m.chat, 'Usage: .gamble <amount>', m.key);
      const win = Math.random() < 0.45;
      if (win) {
        db.updateUser(m.sender, { balance: u.balance + amount });
        await sendText(sock, m.chat, `🎉 You won! +$${amount}\nNew balance: $${u.balance + amount}`, m.key);
      } else {
        db.updateUser(m.sender, { balance: u.balance - amount });
        await sendText(sock, m.chat, `💸 You lost $${amount}.\nNew balance: $${u.balance - amount}`, m.key);
      }
    },
  },
  {
    name: 'beg',
    aliases: [],
    category: 'Economy',
    desc: 'Beg for a small amount of money',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      const amount = Math.floor(Math.random() * 100) + 1;
      db.updateUser(m.sender, { balance: u.balance + amount });
      const lines = ['A stranger gave you', 'You found', 'Someone donated'];
      await sendText(sock, m.chat, `🙏 ${lines[Math.floor(Math.random() * lines.length)]} $${amount}!`, m.key);
    },
  },
  {
    name: 'fish',
    aliases: [],
    category: 'Economy',
    desc: 'Go fishing for money',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      const catches = ['an old boot (worthless)', 'a small fish ($50)', 'a big tuna ($300)', 'a rare golden fish ($800)', 'nothing'];
      const values = [0, 50, 300, 800, 0];
      const idx = Math.floor(Math.random() * catches.length);
      db.updateUser(m.sender, { balance: u.balance + values[idx] });
      await sendText(sock, m.chat, `🎣 You caught ${catches[idx]}!`, m.key);
    },
  },
  {
    name: 'mine',
    aliases: [],
    category: 'Economy',
    desc: 'Go mining for resources',
    async run(sock, m) {
      const u = db.getUser(m.sender);
      const finds = [{ n: 'coal', v: 30 }, { n: 'iron', v: 90 }, { n: 'gold', v: 250 }, { n: 'diamond', v: 600 }];
      const f = finds[Math.floor(Math.random() * finds.length)];
      db.updateUser(m.sender, { balance: u.balance + f.v });
      await sendText(sock, m.chat, `⛏️ You mined ${f.n} worth $${f.v}!`, m.key);
    },
  },
  {
    name: 'leaderboard',
    aliases: ['rich', 'lb'],
    category: 'Economy',
    desc: 'View the richest users',
    async run(sock, m) {
      const all = Object.values(db._raw.users).sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank)).slice(0, 10);
      const text = all.map((u, i) => `${i + 1}. @${u.jid.split('@')[0]} - $${u.balance + u.bank}`).join('\n');
      await sendText(sock, m.chat, `🏆 *Richest Users*\n\n${text || 'No data yet.'}`, m.key, { mentionedJid: all.map((u) => u.jid) });
    },
  },
];
