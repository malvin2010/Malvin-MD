require('dotenv').config();

module.exports = {
  BOT_NAME: 'Malvin MD',
  CREATOR: 'Malvin C',
  VERSION: '1.0.0',

  // Owner numbers (WhatsApp format, no + or spaces)
  OWNER_NUMBERS: ['263780026088', '263776676755'],

  // Official channel that every command's footer/branding points to
  CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb7Eyki7T8bSNsTtjv1q',
  CHANNEL_NAME: 'Malvin MD Official',

  // Prefix(es) the bot listens to
  PREFIXES: ['.', '!', '#'],

  // Session / auth folder
  SESSION_DIR: process.env.SESSION_DIR || './session',

  // Pairing mode: 'code' (recommended for headless hosts) or 'qr'
  PAIRING_METHOD: process.env.PAIRING_METHOD || 'code',

  // The number the bot itself is running as (used only for code-pairing via CLI/env)
  BOT_NUMBER: process.env.BOT_NUMBER || '',

  // Public API base used by many .tools/.search/.downloader commands.
  // These are free community endpoints - swap for your own key-based
  // provider in .env if you have one, the bot will use it automatically.
  API: {
    BASE: process.env.API_BASE || 'https://api.giftedtech.web.id/api',
    KEY: process.env.API_KEY || 'gifted',
  },

  // Web pairing dashboard port
  PORT: process.env.PORT || 3000,

  // Auto react to every command with this emoji before replying
  AUTO_READ: true,
  AUTO_REACT: true,

  // Anything above this many members in a group triggers "large group" cooldown
  MAX_GROUP_WARN: 250,
};
