const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const config = require('../config');
const { sendText, sendImage, sendSticker, sendAudio, sendVideo } = require('../lib/sendMsg');

async function downloadQuoted(sock, m, types) {
  const target = m.quoted && types.includes(m.quoted.type) ? m.quoted : (types.includes(m.type) ? m : null);
  if (!target) return null;
  const stream = await sock.downloadMediaMessage({
    key: { ...m.key, id: target.id || m.key.id },
    message: target.message,
  });
  return stream;
}

function tmpFile(ext) {
  return path.join(os.tmpdir(), `malvin_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
}

module.exports = [
  {
    name: 'sticker',
    aliases: ['s', 'stick'],
    category: 'Converter',
    premium: true,
    desc: 'Convert image/video to sticker (reply to media)',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['imageMessage', 'videoMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an image or short video with .sticker', m.key);
      const sticker = new Sticker(buffer, {
        pack: config.BOT_NAME,
        author: config.CREATOR,
        type: StickerTypes.FULL,
        quality: 70,
      });
      const stickerBuffer = await sticker.toBuffer();
      await sendSticker(sock, m.chat, stickerBuffer, m.key);
    },
  },
  {
    name: 'toimg',
    aliases: ['simg', 'stoimg'],
    category: 'Converter',
    premium: true,
    desc: 'Convert a sticker back to an image (reply to sticker)',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['stickerMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to a sticker with .toimg', m.key);
      await sendImage(sock, m.chat, buffer, '✅ Converted to image', m.key);
    },
  },
  {
    name: 'attp',
    aliases: ['ttp'],
    category: 'Converter',
    premium: true,
    desc: 'Turn text into an animated sticker',
    async run(sock, m, args, { text }) {
      if (!text) return sendText(sock, m.chat, 'Usage: .attp Malvin MD', m.key);
      const img = new Jimp(512, 512, '#00000000');
      const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
      img.print(font, 0, 0, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 512, 512);
      const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
      const sticker = new Sticker(buffer, { pack: config.BOT_NAME, author: config.CREATOR, type: StickerTypes.FULL });
      await sendSticker(sock, m.chat, await sticker.toBuffer(), m.key);
    },
  },
  {
    name: 'tomp3',
    aliases: ['toaudio'],
    category: 'Converter',
    premium: true,
    desc: 'Extract audio from a video (reply to video)',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['videoMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to a video with .tomp3', m.key);
      const inFile = tmpFile('mp4');
      const outFile = tmpFile('mp3');
      fs.writeFileSync(inFile, buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(inFile).noVideo().audioCodec('libmp3lame').save(outFile).on('end', resolve).on('error', reject);
      });
      const audioBuffer = fs.readFileSync(outFile);
      await sendAudio(sock, m.chat, audioBuffer, m.key, false);
      fs.unlinkSync(inFile); fs.unlinkSync(outFile);
    },
  },
  {
    name: 'tovn',
    aliases: ['toptt'],
    category: 'Converter',
    premium: true,
    desc: 'Convert audio to a voice note (reply to audio)',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['audioMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an audio file with .tovn', m.key);
      const inFile = tmpFile('mp3');
      const outFile = tmpFile('ogg');
      fs.writeFileSync(inFile, buffer);
      await new Promise((resolve, reject) => {
        ffmpeg(inFile).audioCodec('libopus').audioBitrate('64k').format('ogg').save(outFile).on('end', resolve).on('error', reject);
      });
      const outBuffer = fs.readFileSync(outFile);
      await sendAudio(sock, m.chat, outBuffer, m.key, true);
      fs.unlinkSync(inFile); fs.unlinkSync(outFile);
    },
  },
  {
    name: 'grayscale',
    aliases: ['bw', 'blackwhite'],
    category: 'Converter',
    premium: true,
    desc: 'Convert an image to grayscale',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['imageMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an image with .grayscale', m.key);
      const img = await Jimp.read(buffer);
      img.grayscale();
      const out = await img.getBufferAsync(Jimp.MIME_JPEG);
      await sendImage(sock, m.chat, out, '⚫⚪ Grayscale applied', m.key);
    },
  },
  {
    name: 'invert',
    aliases: ['negative'],
    category: 'Converter',
    premium: true,
    desc: 'Invert the colors of an image',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['imageMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an image with .invert', m.key);
      const img = await Jimp.read(buffer);
      img.invert();
      const out = await img.getBufferAsync(Jimp.MIME_JPEG);
      await sendImage(sock, m.chat, out, '🎨 Inverted', m.key);
    },
  },
  {
    name: 'blur',
    aliases: [],
    category: 'Converter',
    premium: true,
    desc: 'Blur an image',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['imageMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an image with .blur', m.key);
      const img = await Jimp.read(buffer);
      img.blur(8);
      const out = await img.getBufferAsync(Jimp.MIME_JPEG);
      await sendImage(sock, m.chat, out, '💧 Blurred', m.key);
    },
  },
  {
    name: 'resize',
    aliases: [],
    category: 'Converter',
    premium: true,
    desc: 'Resize an image - usage .resize 512 512',
    async run(sock, m, args) {
      const buffer = await downloadQuoted(sock, m, ['imageMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an image with .resize <width> <height>', m.key);
      const w = parseInt(args[0]) || 512;
      const h = parseInt(args[1]) || 512;
      const img = await Jimp.read(buffer);
      img.resize(w, h);
      const out = await img.getBufferAsync(Jimp.MIME_JPEG);
      await sendImage(sock, m.chat, out, `📐 Resized to ${w}x${h}`, m.key);
    },
  },
  {
    name: 'circle',
    aliases: ['circlecrop'],
    category: 'Converter',
    premium: true,
    desc: 'Crop an image into a circle',
    async run(sock, m) {
      const buffer = await downloadQuoted(sock, m, ['imageMessage']);
      if (!buffer) return sendText(sock, m.chat, 'Reply to an image with .circle', m.key);
      const img = await Jimp.read(buffer);
      img.resize(512, 512).circle();
      const out = await img.getBufferAsync(Jimp.MIME_PNG);
      await sendImage(sock, m.chat, out, '⭕ Circle crop done', m.key);
    },
  },
];
