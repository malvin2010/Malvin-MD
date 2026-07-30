const chalk = require('chalk');
const figlet = require('figlet');
const config = require('./config');
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
