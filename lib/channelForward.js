const config = require('../config');

// The invite code is the last segment of the channel link
const INVITE_CODE = config.CHANNEL_LINK.split('/').pop();

let cachedNewsletter = null;

/**
 * Resolves the real newsletter (channel) jid + metadata once per run and
 * caches it, so we don't hit the API on every single message.
 */
async function resolveChannel(sock) {
  if (cachedNewsletter) return cachedNewsletter;
  try {
    const meta = await sock.newsletterMetadata('invite', INVITE_CODE);
    if (meta && meta.id) {
      cachedNewsletter = {
        id: meta.id,
        name: meta.name || config.CHANNEL_NAME,
      };
      return cachedNewsletter;
    }
  } catch (e) {
    // Falls through to the static fallback below - channel metadata can
    // fail to resolve if WhatsApp rate-limits newsletter lookups.
  }
  cachedNewsletter = { id: null, name: config.CHANNEL_NAME };
  return cachedNewsletter;
}

/**
 * Returns a contextInfo object that, merged into any outgoing message,
 * makes WhatsApp render it as "Forwarded many times" from the channel.
 */
function forwardedContext(extra = {}) {
  const base = {
    isForwarded: true,
    forwardingScore: 9999,
    ...extra,
  };
  if (cachedNewsletter && cachedNewsletter.id) {
    base.forwardedNewsletterMessageInfo = {
      newsletterJid: cachedNewsletter.id,
      newsletterName: cachedNewsletter.name,
      serverMessageId: Math.floor(Math.random() * 100000),
    };
  }
  return base;
}

module.exports = { resolveChannel, forwardedContext, INVITE_CODE };
