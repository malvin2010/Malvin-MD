const axios = require('axios');
const { sendText, sendImage } = require('../lib/sendMsg');

module.exports = [
  {
    name: 'wiki',
    aliases: ['wikipedia'],
    category: 'Search',
    desc: 'Search Wikipedia for a topic',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .wiki Albert Einstein', m.key);
      try {
        const { data } = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
        await sendText(sock, m.chat, `📖 *${data.title}*\n\n${data.extract}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ No Wikipedia article found for that.', m.key);
      }
    },
  },
  {
    name: 'define',
    aliases: ['dictionary'],
    category: 'Search',
    desc: 'Get the definition of a word',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .define ephemeral', m.key);
      try {
        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`);
        const entry = data[0];
        const meaning = entry.meanings[0];
        const def = meaning.definitions[0];
        await sendText(sock, m.chat, `📘 *${entry.word}* (${meaning.partOfSpeech})\n\n${def.definition}${def.example ? `\n\nExample: "${def.example}"` : ''}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ No definition found for that word.', m.key);
      }
    },
  },
  {
    name: 'github',
    aliases: ['gh'],
    category: 'Search',
    desc: 'Look up a GitHub user',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .github torvalds', m.key);
      try {
        const { data } = await axios.get(`https://api.github.com/users/${encodeURIComponent(text)}`);
        const info = `🐙 *${data.login}*\n\nName: ${data.name || 'N/A'}\nBio: ${data.bio || 'N/A'}\nRepos: ${data.public_repos}\nFollowers: ${data.followers}\nProfile: ${data.html_url}`;
        if (data.avatar_url) {
          const img = await axios.get(data.avatar_url, { responseType: 'arraybuffer' });
          await sendImage(sock, m.chat, Buffer.from(img.data), info, m.key);
        } else {
          await sendText(sock, m.chat, info, m.key);
        }
      } catch (e) {
        await sendText(sock, m.chat, '❌ GitHub user not found.', m.key);
      }
    },
  },
  {
    name: 'npm',
    aliases: [],
    category: 'Search',
    desc: 'Look up an npm package',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .npm express', m.key);
      try {
        const { data } = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(text)}`);
        const latest = data['dist-tags'].latest;
        await sendText(sock, m.chat, `📦 *${data.name}*\n\nLatest: ${latest}\nDescription: ${data.description || 'N/A'}\nLicense: ${data.license || 'N/A'}\nnpmjs.com/package/${data.name}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Package not found on npm.', m.key);
      }
    },
  },
  {
    name: 'pypi',
    aliases: [],
    category: 'Search',
    desc: 'Look up a Python (PyPI) package',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .pypi requests', m.key);
      try {
        const { data } = await axios.get(`https://pypi.org/pypi/${encodeURIComponent(text)}/json`);
        const info = data.info;
        await sendText(sock, m.chat, `🐍 *${info.name}*\n\nVersion: ${info.version}\nSummary: ${info.summary}\nHome: ${info.home_page || 'N/A'}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Package not found on PyPI.', m.key);
      }
    },
  },
  {
    name: 'movie',
    aliases: ['imdb'],
    category: 'Search',
    desc: 'Search movie information',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .movie Inception', m.key);
      try {
        const { data } = await axios.get(`https://www.omdbapi.com/`, { params: { t: text, apikey: 'trilogy' } });
        if (data.Response === 'False') throw new Error('not found');
        const info = `🎬 *${data.Title}* (${data.Year})\n\nGenre: ${data.Genre}\nRating: ${data.imdbRating}/10\nPlot: ${data.Plot}`;
        if (data.Poster && data.Poster !== 'N/A') {
          const img = await axios.get(data.Poster, { responseType: 'arraybuffer' });
          await sendImage(sock, m.chat, Buffer.from(img.data), info, m.key);
        } else {
          await sendText(sock, m.chat, info, m.key);
        }
      } catch (e) {
        await sendText(sock, m.chat, '❌ Movie not found.', m.key);
      }
    },
  },
  {
    name: 'ip',
    aliases: ['iplookup'],
    category: 'Search',
    desc: 'Look up information about an IP address',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .ip 8.8.8.8', m.key);
      try {
        const { data } = await axios.get(`http://ip-api.com/json/${encodeURIComponent(text)}`);
        if (data.status !== 'success') throw new Error('invalid');
        await sendText(sock, m.chat, `🌐 *IP Info: ${text}*\n\nCountry: ${data.country}\nRegion: ${data.regionName}\nCity: ${data.city}\nISP: ${data.isp}\nTimezone: ${data.timezone}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Invalid IP address.', m.key);
      }
    },
  },
  {
    name: 'country',
    aliases: [],
    category: 'Search',
    desc: 'Get information about a country',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .country Zimbabwe', m.key);
      try {
        const { data } = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(text)}`);
        const c = data[0];
        await sendText(sock, m.chat, `🏳️ *${c.name.common}*\n\nCapital: ${c.capital?.[0]}\nRegion: ${c.region}\nPopulation: ${c.population.toLocaleString()}\nCurrency: ${Object.values(c.currencies || {})[0]?.name || 'N/A'}`, m.key);
      } catch (e) {
        await sendText(sock, m.chat, '❌ Country not found.', m.key);
      }
    },
  },
];
