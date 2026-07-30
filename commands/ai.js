const axios = require('axios');
const config = require('../config');
const { sendText, sendImage } = require('../lib/sendMsg');
const { suggestCommand } = require('../lib/typoCorrect');
const { commands, allNames } = require('../lib/commandHandler');

module.exports = [
  {
    name: 'ai',
    aliases: ['gpt', 'ask'],
    category: 'AI',
    premium: true,
    desc: 'Chat with the built-in AI assistant',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .ai What is the capital of France?', m.key);
      try {
        const { data } = await axios.get(`${config.API.BASE}/ai/gpt`, { params: { q: text, apikey: config.API.KEY } });
        const reply = data?.result || data?.message;
        if (!reply) throw new Error('empty response');
        await sendText(sock, m.chat, `🤖 *Malvin AI*\n\n${reply}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ The AI service is unavailable right now, please try again shortly.', m.key);
      }
    },
  },
  {
    name: 'imagine',
    aliases: ['aiimage', 'txt2img'],
    category: 'AI',
    premium: true,
    desc: 'Generate an AI image from a text prompt',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .imagine a cat riding a skateboard', m.key);
      try {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}`;
        const { data } = await axios.get(url, { responseType: 'arraybuffer' });
        await sendImage(sock, m.chat, Buffer.from(data), `🎨 "${text}"`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Image generation failed, try a different prompt.', m.key);
      }
    },
  },
  {
    name: 'correct',
    aliases: ['fixcmd'],
    category: 'AI',
    desc: 'Ask Malvin AI to suggest the correct command spelling',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .correct men7', m.key);
      const clean = text.replace(/^[.!#]/, '').toLowerCase();
      const match = suggestCommand(clean, allNames());
      if (!match) return sendText(sock, m.chat, `🤖 I couldn't find a close match for "${text}".`, m.key);
      if (match.exact) return sendText(sock, m.chat, `✅ "${text}" is already a valid command.`, m.key);
      await sendText(sock, m.chat, `🤖 *Malvin AI suggests:*\n\nDid you mean *.${match.suggestion}*?`, m.key);
    },
  },
  {
    name: 'summarize',
    aliases: ['summary'],
    category: 'AI',
    premium: true,
    desc: 'Summarize a block of text using AI',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .summarize <paste text here>', m.key);
      try {
        const { data } = await axios.get(`${config.API.BASE}/ai/gpt`, { params: { q: `Summarize this in 3 sentences: ${text}`, apikey: config.API.KEY } });
        const reply = data?.result || data?.message;
        if (!reply) throw new Error('empty');
        await sendText(sock, m.chat, `📝 *Summary*\n\n${reply}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Could not summarize right now, try again shortly.', m.key);
      }
    },
  },
];
