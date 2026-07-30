const axios = require('axios');
const { sendText } = require('../lib/sendMsg');

const TRUTHS = [
  "What's the most embarrassing thing that's happened to you at school or work?",
  "Have you ever lied to your best friend? What about?",
  "What's a secret you've never told your parents?",
  "Who was your first crush?",
  "What's the weirdest dream you've ever had?",
  "What's something you're insecure about?",
  "Have you ever cheated on a test?",
  "What's the pettiest thing you've ever done?",
  "What's your biggest fear?",
  "What's the last lie you told?",
];
const DARES = [
  "Send the 5th photo in your gallery to this chat.",
  "Text your crush 'I miss you' right now.",
  "Do 15 push-ups and send a video.",
  "Speak in an accent for the next 10 minutes.",
  "Let the group pick your WhatsApp status for a day.",
  "Post an embarrassing childhood photo in your status.",
  "Call a random contact and sing happy birthday.",
  "Change your profile picture to whatever the group wants for an hour.",
  "Send a voice note singing your favorite song.",
  "Type your next 3 messages using only emojis.",
];
const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my computer I needed a break, and it said no problem — it'll go to sleep too.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I used to be a banker, but I lost interest.",
  "Why don't skeletons fight each other? They don't have the guts.",
  "I'm reading a book on anti-gravity. It's impossible to put down.",
  "What do you call fake spaghetti? An impasta.",
];
const QUOTES = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "It always seems impossible until it's done. - Nelson Mandela",
  "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
];
const FACTS = [
  "Honey never spoils - archaeologists have found 3000-year-old honey that's still edible.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus is longer than its year.",
  "Bananas are berries, but strawberries aren't.",
  "The Eiffel Tower can grow taller in summer due to metal expansion.",
];
const RIDDLES = [
  { q: "What has keys but no locks, space but no room, and you can enter but can't go inside?", a: "A keyboard" },
  { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
  { q: "What has to be broken before you can use it?", a: "An egg" },
  { q: "I'm tall when I'm young and short when I'm old. What am I?", a: "A candle" },
];
const COMPLIMENTS = [
  "You bring a spark of energy to every room you walk into.",
  "Your ideas always add real value to the conversation.",
  "You have a way of making hard things look easy.",
  "People trust you because you follow through.",
];
const WOULD_U_RATHER = [
  "Would you rather have unlimited money or unlimited time?",
  "Would you rather be able to fly or be invisible?",
  "Would you rather always be 10 minutes late or 20 minutes early?",
  "Would you rather lose all your memories or never make new ones?",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

module.exports = [
  { name: 'truth', aliases: [], category: 'Fun', desc: 'Get a random truth question', async run(sock, m) { await sendText(sock, m.chat, `🤔 *Truth*\n\n${pick(TRUTHS)}`, m.key); } },
  { name: 'dare', aliases: [], category: 'Fun', desc: 'Get a random dare', async run(sock, m) { await sendText(sock, m.chat, `🔥 *Dare*\n\n${pick(DARES)}`, m.key); } },
  { name: 'joke', aliases: [], category: 'Fun', desc: 'Get a random joke', async run(sock, m) { await sendText(sock, m.chat, `😂 *Joke*\n\n${pick(JOKES)}`, m.key); } },
  { name: 'quote', aliases: [], category: 'Fun', desc: 'Get an inspirational quote', async run(sock, m) { await sendText(sock, m.chat, `💬 *Quote*\n\n${pick(QUOTES)}`, m.key); } },
  { name: 'fact', aliases: [], category: 'Fun', desc: 'Get a random fact', async run(sock, m) { await sendText(sock, m.chat, `📚 *Fact*\n\n${pick(FACTS)}`, m.key); } },
  {
    name: 'riddle', aliases: [], category: 'Fun', desc: 'Get a random riddle',
    async run(sock, m) { const r = pick(RIDDLES); await sendText(sock, m.chat, `🧩 *Riddle*\n\n${r.q}\n\n_Reply with .answer to reveal it_`, m.key); },
  },
  { name: 'compliment', aliases: [], category: 'Fun', desc: 'Get a random compliment', async run(sock, m) { await sendText(sock, m.chat, `✨ ${pick(COMPLIMENTS)}`, m.key); } },
  { name: 'wouldurather', aliases: ['wyr'], category: 'Fun', desc: 'Would you rather question', async run(sock, m) { await sendText(sock, m.chat, `🤷 *Would you rather...*\n\n${pick(WOULD_U_RATHER)}`, m.key); } },
  {
    name: '8ball', aliases: ['eightball'], category: 'Fun', desc: 'Ask the magic 8-ball a question',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .8ball Will I pass my exam?', m.key);
      const answers = ['Yes, definitely.', 'No way.', 'Ask again later.', 'It is certain.', 'Very doubtful.', 'Signs point to yes.', 'Absolutely not.'];
      await sendText(sock, m.chat, `🎱 *${text}*\n\n${pick(answers)}`, m.key);
    },
  },
  {
    name: 'ship', aliases: [], category: 'Fun', desc: 'Ship two people together with a percentage',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .ship John Mary', m.key);
      const pct = Math.floor(Math.random() * 101);
      const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
      await sendText(sock, m.chat, `💘 *Ship Result*\n\n${text}\n${bar} ${pct}%`, m.key);
    },
  },
  {
    name: 'roast', aliases: [], category: 'Fun', desc: 'Get a light-hearted roast',
    async run(sock, m) {
      const roasts = [
        "You're not stupid; you just have bad luck thinking.",
        "I'd explain it to you, but I left my crayons at home.",
        "You bring everyone so much joy... when you leave the room.",
        "You're proof that even evolution takes a break sometimes.",
      ];
      await sendText(sock, m.chat, `🔥 ${pick(roasts)}`, m.key);
    },
  },
  {
    name: 'ascii', aliases: [], category: 'Fun', desc: 'Convert text to a simple ascii banner',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .ascii Malvin', m.key);
      const line = '*'.repeat(text.length + 4);
      await sendText(sock, m.chat, `${line}\n* ${text.toUpperCase()} *\n${line}`, m.key);
    },
  },
  {
    name: 'meme', aliases: [], category: 'Fun', desc: 'Get a random meme image',
    async run(sock, m) {
      try {
        const { data } = await axios.get('https://meme-api.com/gimme');
        const { sendImage } = require('../lib/sendMsg');
        const axiosImg = await axios.get(data.url, { responseType: 'arraybuffer' });
        await sendImage(sock, m.chat, Buffer.from(axiosImg.data), data.title, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Could not fetch a meme right now.', m.key);
      }
    },
  },
  {
    name: 'flirt', aliases: ['pickupline'], category: 'Fun', desc: 'Get a cheesy pickup line',
    async run(sock, m) {
      const lines = [
        "Are you a parking ticket? Because you've got fine written all over you.",
        "Do you have a map? I keep getting lost in your eyes.",
        "Is your name Google? Because you have everything I've been searching for.",
        "Are you made of copper and tellurium? Because you're Cu-Te.",
      ];
      await sendText(sock, m.chat, `😏 ${pick(lines)}`, m.key);
    },
  },
];
