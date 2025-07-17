// FONPAGOBOT

const PORT   = process.env.PORT   || 3000
const TOKEN  = process.env.TOKEN  || ''
const BOTURL = process.env.BOTURL || ''
if(!TOKEN){ console.error('TOKEN is required'); process.exit(0) }
if(!BOTURL){ console.error('BOTURL is required'); process.exit(0) }

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception: ', err)
})

const fs         = require('node:fs')
const path       = require('node:path')
const express    = require('express')
const ejs        = require('ejs')
const {Telegraf} = require('telegraf')
const actions    = require('./actions')


// Start
try {
  console.warn(new Date(), 'App is running...')
  const hook = `${BOTURL}/bot${TOKEN}`
  //console.log(hook)
  const bot = new Telegraf(TOKEN)
  bot.catch((err, ctx) => { console.error(`Error for ${ctx.updateType}`, err)})
  bot.telegram.setWebhook(hook)
  //bot.startWebhook(`/bot${TOKEN}`, null, PORT)  // remove
  //bot.use(Telegraf.log())                       // remove

  //---- Commands
  bot.start((ctx) => ctx.reply('Welcome to Fonpago, type `register YourName` to open an account then `help` for more info'))
  bot.help((ctx)  => actions.onHelp(ctx))
  bot.on('contact', (ctx) => actions.onContact(ctx))
  bot.hears('hi', (ctx) => ctx.reply('Hey there'))
  bot.on('message', async (ctx) => actions.parse(ctx)) // Keep this line as is or it will cause messages not being delivered, why? Only god knows
//TODO:
//bot.on('inline_query', async (ctx) => actions.parse(ctx))
/*
  bot.on('inline_query', async (ctx) => {
    console.log('INLINE', ctx.inlineQuery)
    if(!ctx.inlineQuery.query){
      console.log('QUERY EMPTY')
      return ctx.answerInlineQuery([{
        id: '1',
        type: 'article', 
        title: 'Help', 
        message_text: 'Type help for more info',
      }])
    }
    // TODO: check action
    const results = [{
      id: ctx.inlineQuery.id,
      type: 'article', 
      title: 'Hello', 
      message_text: 'Hello world',
      //description: 'This is an example result',
      //thumb_url: 'https://example.com/thumb.jpg',
      //url: 'https://example.com'
    }]
    console.log('RESULTS', results)
    return ctx.answerInlineQuery(results) 
  })
*/
  bot.launch()
  
  // Enable graceful stop
  process.once('SIGINT',  () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
  
  const app = express()
  //app.use(bot.webhookCallback('/bot'+TOKEN))
  app.use(express.json())
  app.use(bot.webhookCallback('/bot'+TOKEN));
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.set('views', path.join(__dirname, 'public/views'))
  app.set('view engine', 'html')
  app.engine('html', ejs.renderFile)

  //---- Router
  app.get('/', (req, res) => res.render('index'))
  //app.post(`/bot${TOKEN}`, (req, res) => {
  //  bot.handleUpdate(req.body, res)
  //})
  app.get('/test', async (req, res) => {
    const info = await bot.telegram.getWebhookInfo()
    res.json(info)
  })

  //app.listen(PORT)

  const server = app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
  })

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: gracefully shutting down')
    if (server) {
      server.close(() => {
        console.log('HTTP server closed')
      })
    }
  })

} catch (ex) {
  console.error('App Error:',ex)
}

// END