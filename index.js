const chalk = require('chalk');
const figlet = require('figlet');
const config = require('./config');
const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 3000

// Serve all files in website/public
app.use(express.static(path.join(__dirname, 'website/public')))

app.listen(PORT, () => console.log(`Web + Bot running on ${PORT}`))
const { startBot } = require('./lib/connect');

console.log(chalk.cyan(figlet.textSync('Malvin MD', { horizontalLayout: 'full' })));
console.log(chalk.yellow(`By ${config.CREATOR} • v${config.VERSION}\n`));

startBot({
  onReady: (sock) => {
    console.log(chalk.green(`${config.BOT_NAME} is online and listening for commands.`));
  },
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
