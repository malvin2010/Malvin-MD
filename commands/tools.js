const axios = require('axios');
const { create, all } = require('mathjs');
const math = create(all);
const QRCode = require('qrcode');
const config = require('../config');
const { sendText, sendImage } = require('../lib/sendMsg');

const MORSE_MAP = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  ' ': '/',
};
const MORSE_REV = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

module.exports = [
  {
    name: 'calculate',
    aliases: ['calc', 'math'],
    category: 'Tools',
    desc: 'Evaluate a math expression',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .calc 5*(3+2)^2', m.key);
      try {
        const result = math.evaluate(text);
        await sendText(sock, m.chat, `🧮 *Result*\n\n${text} = *${result}*`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, `❌ Invalid expression: ${e.message}`, m.key);
      }
    },
  },
  {
    name: 'base64encode',
    aliases: ['b64encode', 'tobase64'],
    category: 'Tools',
    desc: 'Encode text to base64',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .base64encode hello world', m.key);
      await sendText(sock, m.chat, `🔐 ${Buffer.from(text).toString('base64')}`, m.key);
    },
  },
  {
    name: 'base64decode',
    aliases: ['b64decode', 'frombase64'],
    category: 'Tools',
    desc: 'Decode base64 to text',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .base64decode aGVsbG8=', m.key);
      try {
        await sendText(sock, m.chat, `🔓 ${Buffer.from(text, 'base64').toString('utf-8')}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Invalid base64 string.', m.key);
      }
    },
  },
  {
    name: 'text2hex',
    aliases: ['tohex'],
    category: 'Tools',
    desc: 'Convert text to hex',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .text2hex hello', m.key);
      await sendText(sock, m.chat, Buffer.from(text).toString('hex'), m.key);
    },
  },
  {
    name: 'hex2text',
    aliases: ['fromhex'],
    category: 'Tools',
    desc: 'Convert hex to text',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .hex2text 68656c6c6f', m.key);
      try {
        await sendText(sock, m.chat, Buffer.from(text.replace(/\s/g, ''), 'hex').toString('utf-8'), m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Invalid hex string.', m.key);
      }
    },
  },
  {
    name: 'text2binary',
    aliases: ['tobinary'],
    category: 'Tools',
    desc: 'Convert text to binary',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .text2binary hello', m.key);
      const bin = text.split('').map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      await sendText(sock, m.chat, bin, m.key);
    },
  },
  {
    name: 'binary2text',
    aliases: ['frombinary'],
    category: 'Tools',
    desc: 'Convert binary to text',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .binary2text 01001000 01101001', m.key);
      try {
        const str = text.trim().split(/\s+/).map((b) => String.fromCharCode(parseInt(b, 2))).join('');
        await sendText(sock, m.chat, str, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Invalid binary string.', m.key);
      }
    },
  },
  {
    name: 'morse',
    aliases: ['tomorse'],
    category: 'Tools',
    desc: 'Convert text to morse code',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .morse SOS', m.key);
      const out = text.toUpperCase().split('').map((c) => MORSE_MAP[c] ?? c).join(' ');
      await sendText(sock, m.chat, out, m.key);
    },
  },
  {
    name: 'unmorse',
    aliases: ['frommorse'],
    category: 'Tools',
    desc: 'Convert morse code to text',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .unmorse ... --- ...', m.key);
      const out = text.trim().split(' ').map((c) => MORSE_REV[c] ?? c).join('');
      await sendText(sock, m.chat, out, m.key);
    },
  },
  {
    name: 'qrcode',
    aliases: ['qr'],
    category: 'Tools',
    desc: 'Generate a QR code from text',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .qr https://example.com', m.key);
      const buffer = await QRCode.toBuffer(text, { width: 512 });
      await sendImage(sock, m.chat, buffer, `📱 QR code for: ${text}`, m.key);
    },
  },
  {
    name: 'translate',
    aliases: ['tr'],
    category: 'Tools',
    premium: true,
    desc: 'Translate text - usage .tr en hello world',
    async run(sock, m, args, { text }) {
      if (args.length < 2) return sendText(sock, m.chat, 'Usage: .translate <lang_code> <text>\nEg: .translate fr hello world', m.key);
      const lang = args[0];
      const content = args.slice(1).join(' ');
      try {
        const { data } = await axios.get('https://api.mymemory.translated.net/get', {
          params: { q: content, langpair: `en|${lang}` },
        });
        await sendText(sock, m.chat, `🌐 *Translation (${lang})*\n\n${data.responseData.translatedText}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Translation service unavailable right now.', m.key);
      }
    },
  },
  {
    name: 'weather',
    aliases: ['climate'],
    category: 'Tools',
    premium: true,
    desc: 'Get current weather for a city',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .weather Harare', m.key);
      try {
        const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(text)}`, { params: { format: 'j1' } });
        const c = data.current_condition[0];
        const out = `🌤️ *Weather in ${text}*\n\nTemp: ${c.temp_C}°C (feels ${c.FeelsLikeC}°C)\nCondition: ${c.weatherDesc[0].value}\nHumidity: ${c.humidity}%\nWind: ${c.windspeedKmph} km/h`;
        await sendText(sock, m.chat, out, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Could not fetch weather for that location.', m.key);
      }
    },
  },
  {
    name: 'shorturl',
    aliases: ['short'],
    category: 'Tools',
    desc: 'Shorten a URL',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .shorturl https://example.com/long-link', m.key);
      try {
        const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
        await sendText(sock, m.chat, `🔗 ${data}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Could not shorten that URL.', m.key);
      }
    },
  },
  {
    name: 'reverse',
    aliases: ['rev'],
    category: 'Tools',
    desc: 'Reverse text',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .reverse hello', m.key);
      await sendText(sock, m.chat, text.split('').reverse().join(''), m.key);
    },
  },
  {
    name: 'wordcount',
    aliases: ['wc'],
    category: 'Tools',
    desc: 'Count words and characters',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .wordcount your text here', m.key);
      const words = text.trim().split(/\s+/).length;
      await sendText(sock, m.chat, `📝 Words: ${words}\n🔤 Characters: ${text.length}`, m.key);
    },
  },
  {
    name: 'palindrome',
    aliases: ['ispalindrome'],
    category: 'Tools',
    desc: 'Check if text is a palindrome',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .palindrome level', m.key);
      const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isPalin = clean === clean.split('').reverse().join('');
      await sendText(sock, m.chat, isPalin ? '✅ That is a palindrome!' : '❌ Not a palindrome.', m.key);
    },
  },
  {
    name: 'timestamp',
    aliases: ['time'],
    category: 'Tools',
    desc: 'Get the current unix timestamp',
    async run(sock, m) {
      await sendText(sock, m.chat, `🕐 Unix timestamp: ${Math.floor(Date.now() / 1000)}\n📅 ${new Date().toString()}`, m.key);
    },
  },
];
