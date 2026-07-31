const chalk = require('chalk');
const figlet = require('figlet');
const config = require('./config');
const express = require('express')
const path = require('path')
const fs = require('fs') // added for auto pair
const app = express()
const PORT = process.env.PORT || 3000

// Serve all files in website/public
app.use(express.static(path.join(__dirname, 'website/public')))

app.listen(PORT, () => console.log(`Web + Bot running on ${PORT}`))

const { startBot } = require('./lib/connect');

console.log(chalk.cyan(figlet.textSync('Malvin MD', { horizontalLayout: 'full' })));
console.log(chalk.yellow(`By ${config.CREATOR} • v${config.VERSION}\n`));

const PHONE_NUMBER = "263780026088" // <-- YOUR NUMBER HERE, no +

startBot({
  onReady: async (sock) => {
    console.log(chalk.green(`${config.BOT_NAME} is online and listening for commands.`));
    
    // AUTO PAIR CODE
    if (!fs.existsSync('./session/creds.json')) { // only if no session
        await new Promise(resolve => setTimeout(resolve, 3000)) // wait 3s for socket
        try {
            let code = await sock.requestPairingCode(PHONE_NUMBER)
            code = code?.match(/.{1,4}/g)?.join("-") || code
            console.log(chalk.magenta.bold(`\n🔥 YOUR PAIRING CODE: ${code} 🔥`))
            console.log(chalk.white(`Go to WhatsApp on ${PHONE_NUMBER} > Settings > Linked Devices > Link with phone number`))
        } catch (e) {
            console.log(chalk.red("Failed to get pairing code:", e))
        }
    } else {
        console.log(chalk.blue("Session found. Skipping auto pair."))
    }
  },
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
