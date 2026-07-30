const config = require('../config');
const { forwardedContext } = require('./channelForward');

function footer() {
  return `\n\n> ${config.BOT_NAME} • ${config.CHANNEL_NAME}\n> ${config.CHANNEL_LINK}`;
}

async function sendText(sock, jid, text, quoted, extraCtx = {}) {
  return sock.sendMessage(
    jid,
    {
      text: text + footer(),
      contextInfo: forwardedContext(extraCtx),
    },
    { quoted }
  );
}

async function sendImage(sock, jid, buffer, caption = '', quoted, extraCtx = {}) {
  return sock.sendMessage(
    jid,
    {
      image: buffer,
      caption: caption + footer(),
      contextInfo: forwardedContext(extraCtx),
    },
    { quoted }
  );
}

async function sendVideo(sock, jid, buffer, caption = '', quoted, extraCtx = {}, opts = {}) {
  return sock.sendMessage(
    jid,
    {
      video: buffer,
      caption: caption + footer(),
      contextInfo: forwardedContext(extraCtx),
      ...opts,
    },
    { quoted }
  );
}

async function sendAudio(sock, jid, buffer, quoted, ptt = false, extraCtx = {}) {
  return sock.sendMessage(
    jid,
    {
      audio: buffer,
      mimetype: 'audio/mp4',
      ptt,
      contextInfo: forwardedContext(extraCtx),
    },
    { quoted }
  );
}

async function sendDocument(sock, jid, buffer, fileName, mimetype, quoted, extraCtx = {}) {
  return sock.sendMessage(
    jid,
    {
      document: buffer,
      fileName,
      mimetype,
      caption: footer(),
      contextInfo: forwardedContext(extraCtx),
    },
    { quoted }
  );
}

async function sendSticker(sock, jid, buffer, quoted, extraCtx = {}) {
  return sock.sendMessage(
    jid,
    {
      sticker: buffer,
      contextInfo: forwardedContext(extraCtx),
    },
    { quoted }
  );
}

async function sendButtons(sock, jid, text, buttons, quoted, image, extraCtx = {}) {
  const payload = {
    text: text + footer(),
    footer: config.BOT_NAME,
    buttons,
    headerType: image ? 4 : 1,
    contextInfo: forwardedContext(extraCtx),
  };
  if (image) payload.image = image;
  return sock.sendMessage(jid, payload, { quoted });
}

module.exports = {
  sendText,
  sendImage,
  sendVideo,
  sendAudio,
  sendDocument,
  sendSticker,
  sendButtons,
  footer,
};
