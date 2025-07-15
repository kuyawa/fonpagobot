// FONPAGO

const PORT  = process.env.PORT  || 3000
const TOKEN = process.env.TOKEN || ''
const URL   = process.env.URL   || ''
if(!TOKEN){ console.error('TOKEN is required'); process.exit(0) }
if(!URL){ console.error('URL is required'); process.exit(0) }
//process.on('uncaughtException', function(err) {
//    console.error('Uncaught exception: ', err)
//})

const fs         = require('node:fs')
const path       = require('node:path')
const express    = require('express')
const ejs        = require('ejs')
const {Telegraf} = require('telegraf')
const actions    = require('./actions')


// Start
try {
  console.warn(new Date(), 'App is running...')
  const bot = new Telegraf(TOKEN)
  bot.catch((err, ctx) => { console.error(`Error for ${ctx.updateType}`, err)})
  bot.telegram.setWebhook(`${URL}/bot${TOKEN}`)
  //bot.startWebhook(`/bot${TOKEN}`, null, PORT)
  //bot.use(Telegraf.log())

  //---- Commands
  bot.start((ctx) => ctx.reply('Welcome to Fonpago, type `register YourName` to open an account then `help` for more info'))
  bot.help((ctx)  => actions.onHelp(ctx))
  bot.on('contact', (ctx) => actions.onContact(ctx))
  bot.on('message', async (ctx) => actions.parse(ctx)) // Keep this line as is or it will cause messages not being delivered, why? Only god knows

  bot.launch()

  // Enable graceful stop
  process.once('SIGINT',  () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))

  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('views', path.join(__dirname, 'public/views'))
  app.set('view engine', 'html')
  app.engine('html', ejs.renderFile)
  app.use(bot.webhookCallback('/bot'+TOKEN))

  //---- Router
  app.get('/', (req, res) => res.render('index'))
  app.get('/test', (req, res) => res.send('Tested ok'))
  app.get('/bot', async (req, res) => res.send('OK'))

  app.listen(PORT)
} catch (ex) {
  console.error('App Error:',ex)
}

// END