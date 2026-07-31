const chalk = require('chalk');
const figlet = require('figlet');
const config = require('./config');
const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 3000

// Serve all files in website/public
app.use(express.static(path.join(__dirname, 'website/public')))

// PAIRING API - This makes the website button work
app.get('/code', async (req, res) => {
  const number = req.query.number
  if(!number) return res.json({ error: "Please enter number with country code. Ex: 263780026088" })
  
  if(!global.sock) return res.json({ error: "Bot not ready yet. Wait 5 seconds and try again." })
  
  try {
    let code = await global.sock.requestPairingCode(number)
    code = code?.match(/.{1,4}/g)?.join("-") || code // format 1234-5678
    res.json({ code })
  } catch(e) {
    console.log(chalk.red("Pairing Error:", e))
    res.json({ error: "Failed to generate code. Is number correct?" })
  }
})

app.listen(PORT, () => console.log(chalk.blue(`Web + Bot running on ${PORT}`)))

const { startBot } = require('./lib/connect');

console.log(chalk.cyan(figlet.textSync('Malvin MD', { horizontalLayout: 'full' })));
console.log(chalk.yellow(`By ${config.CREATOR} • v${config.VERSION}\n`));

startBot({
  onReady: async (sock) => {
    global.sock = sock // Make sock available for /code route
    console.log(chalk.green(`${config.BOT_NAME} is online and listening for commands.`));
  },
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
