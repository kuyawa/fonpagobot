// TELEGRAM ACTIONS

const VERSION    = '1.03'
const BASEAPP    = 'telegram:'

const Telegraf   = require('telegraf')
const Markup     = require('telegraf/markup')
const blockchain = require('./blockchain')
const db         = require('./database')
const language   = require('./language')
const security   = require('./security')
const utils      = require('./utils')
const web        = require('./web')

//const serverUrl  = 'https://telegram.org'
const network    = 'testnet'
const APPISDOWN  = process.env.MAINTENANCE==='ON'
const TRADING    = process.env.TRADING==='ON'
const OPENEXKEY  = process.env.OPENEXKEY
const INBOXKEY   = process.env.INBOXKEY
const INBOXURL   = process.env.INBOXURL
const CURRENCY   = 'TON'
const currencies = ['USD', 'EUR', 'JPY', 'CNY', 'INR', 'GBP', 'AUD', 'CAD', 'RUB', 'CHF', 'BRL', 'MXN']
const cryptos    = ['BTC', 'ETH', 'XRP', 'BCH', 'LTC', 'EOS', 'BSV', 'TRX', 'ADA', 'XMR']
const allassets  = currencies.concat(cryptos)

// Default to english
let LANG = 'en'
let VOX  = language.getVocabulary(LANG)

async function maintenance(ctx) {
  console.log('<-- [OFF]', ctx.update.message.from.id, ctx.update.message.text)
  const txt = 'Fonpago is down for maintenance, try again in a moment'
  // TODO: inline_query
  ctx.reply(txt)
}

// Parse all messages and process actions
async function parse(ctx) {
  if(!ctx){ console.log('Error: no context'); return }

  //console.log('Context', ctx)
  if(ctx.update.inline_query){
    ctx.update.message = {
      inline: true,
      from: {
        id: ctx.update.inline_query.id,
        username: ctx.update.inline_query.from.username
      }, 
      text: ctx.update.inline_query.query,
      contact: undefined
    }
  }

  if(APPISDOWN) { maintenance(ctx); return }
  const userid   = BASEAPP+ctx.update.message.from.id
  const handler  = ctx.update.message.from.id
  const username = ctx.update.message.from.username
  const message  = ctx.update.message.text
  const action   = utils.firstWord(message)
  //console.log({handler,username})

  LANG = language.getLanguage(action)
  VOX  = language.getVocabulary(LANG)

  console.log('<--', handler, message)
  if(ctx.update.message.contact) { onContact(ctx); return }
  const data = { userid: userid, handler: handler, action: action, message: message}

  switch(action) {
    case VOX.about    : await sayAbout(ctx, data); break
    case VOX.help     : await sayHelp(ctx, data); break
    case VOX.hello    : await sayHello(ctx, data); break
    case VOX.register : await sayRegister(ctx, data); break
    case VOX.name     : await sayName(ctx, data); break
    case VOX.account  : await sayAccount(ctx, data); break
    case VOX.balance  : await sayBalance(ctx, data); break
    case VOX.history  : await sayHistory(ctx, data); break
    case VOX.pay      : await sendPayment(ctx, data); break
    case VOX.price    : await sayPrice(ctx, data); break
    //case VOX.assets   : await sayAssets(ctx, data); break
    //case VOX.sell     : await sellOrder(ctx, data); break
    //case VOX.buy      : await buyOrder(ctx, data); break
    //case VOX.close    : await closeOrder(ctx, data); break
    //case VOX.book     : await sayOrderbook(ctx, data); break
    //case VOX.orders   : await sayOrders(ctx, data); break
    //case VOX.trades   : await sayTrades(ctx, data); break
    case VOX.test     : await sayTest(ctx, data); break
    //case VOX.say      : await saySomething(ctx, data); break
    //case '@'          : await saySomething(ctx, data); break
    default           : await sayInvalid(ctx, data)
  }
}

async function parseText(user, body, action) {
  function parseRegister(text) {
    const data = { name:'' }
    const words = text.trim().split(/\s+/)
    if (words[0].toLowerCase()!==VOX.register){ return null }
    if (words.length===2){ data.name = words[1] }
    if (words.length>2) { data.name = words.splice(1).join(' ') }
    return data
  }

  function parseName(text) {
    const data = { name:'' }
    const words = text.trim().split(/\s+/)
    if (words[0].toLowerCase()!==VOX.name){ return null }
    if (words.length===2){ data.name = words[1] }
    if (words.length>2) { data.name = words.splice(1).join(' ') }
    return data
  }

  function parsePayment(text) {
    // pay
    // pay {1} to {3}
    // pay {1} {2} to {4}
    // pay {1} to {3} ref {5}
    // pay {1} {2} to {4} ref {6}

    // TODO: Default currency from DB
    const defCurrency = CURRENCY
    const words = text.trim().toLowerCase().split(/\s+/)

    let pos = 0
    if (words[0]!==VOX.pay){ return null }
    const sender = user
    pos = 1
    const amount = words.length>pos ? words[1].trim() : ''
    pos = 2
    let asset = defCurrency
    if(words.length>pos) {
      if(words[2]===VOX.to){
        pos = 3
      } else {
        asset = words[2].trim().toUpperCase()
        pos = 4
      }
    }
    let receiver = ''
    if(words.length>pos){
      receiver = words[pos].trim()
    }
    let reference = ''
    pos+=1
    if(words.length>pos) { 
      pos+=1 // 'ref'
      reference = words[pos].trim()
    }

    data = {
      sender   : sender, 
      receiver : receiver, 
      amount   : amount, 
      asset    : asset,
      reference: reference,
      //message  : body
    }

    return data
  }

  function parseHistory(text) { return null }

  function parseSelling(text) { 
    const words = text.trim().toLowerCase().split(/\s+/)
    if (words.length<3)  { return null }
    if (words[0]!==VOX.sell){ return null }
    const amount = words[1]
    const asset  = words[2].toUpperCase()
    let price = '0' // market price
    if (words.length>3) {
      if(words[3]===VOX.at){ price = (words.length>4 ? words[4] : '0') }
      else { price = words[3] }
    }
    return {amount:amount, asset:asset, price:price}
  }

  function parseBuying(text) { 
    const words = text.trim().toLowerCase().split(/\s+/)
    if (words.length<3)  { return null }
    if (words[0]!==VOX.buy){ return null }
    const amount = words[1]
    const asset  = words[2].toUpperCase()
    let price = '0' // market price
    if (words.length>3) {
      if(words[3]===VOX.at){ price = (words.length>4 ? words[4] : '0') }
      else { price = words[3] }
    }
    return {amount:amount, asset:asset, price:price}
  }

  function parsePrice(text) { 
    const words = text.trim().toUpperCase().split(/\s+/)
    if (words[0].toLowerCase()!==VOX.price){ return null }
    let asset = CURRENCY
    let list  = null
    if (words.length>1) { asset = words[1] }
    if (words.length>2) { list = words.splice(1) }
    return { asset: asset, list: list } 
  }

  function parseClose(text) { 
    const words = text.trim().toUpperCase().split(/\s+/)
    if (words[0].toLowerCase()!=='close'){ return null }
    let orderId = null
    if (words.length>1) { orderId = words[1] }
    return orderId 
  }

  function parseBook(text) { 
    const words = text.trim().toUpperCase().split(/\s+/)
    if (words[0].toLowerCase()!==VOX.book){ return null }
    let base  = 'USD'
    let quote = CURRENCY
    if (words.length>1) { 
      const parts = words[1].split('/')
      if(parts.length>1) { base = parts[0]; quote = parts[1] }
      else { base = parts[0] }
    }
    return { base: base, quote: quote } 
  }

  function parseSetting(text) { return null }

  let data = null

  // ? help hello name account pay balance history price trade buy sell lang set
  switch(action) {
    case '?':          break
    case VOX.help:     break // use parts[1] as in 'help pay'
    case VOX.hello:    break
    case VOX.register: data = parseRegister(body); break
    case VOX.name:     data = parseName(body); break
    case VOX.account:  break
    case VOX.balance:  break
    case VOX.history:  data = parseHistory(body); break
    case VOX.pay:      data = parsePayment(body); break
    case VOX.price:    data = parsePrice(body); break
    case VOX.sell:     data = parseSelling(body); break
    case VOX.buy:      data = parseBuying(body); break
    case VOX.close:    data = parseClose(body); break
    case VOX.book:     data = parseBook(body); break
    case VOX.orders:   break
    case VOX.trades:   break
    case VOX.set:      data = parseSetting(body); break
    default:           data = null
  }

  return data
}


//---- EVENTS

function onHelp(ctx) {
  sayHelp(ctx)
}

function getContact(ctx) {
  const extra = Telegraf.Extra.markup((markup) => {
    return markup.resize().keyboard([
      markup.contactRequestButton(VOX.sendPhoneButton)    
    ])
  })
  ctx.reply(VOX.sendPhoneText, extra)
}

function onContact(ctx) {
  const data = {
    userid   : BASEAPP+ctx.message.contact.user_id,
    handler  : ctx.message.contact.user_id,
    firstName: ctx.message.contact.first_name,
    lastName : ctx.message.contact.last_name,
    phone    : ctx.message.contact.phone_number
  }
  console.log('onContact:', data)
  //console.log(ctx.contact.phone_number)
  // TODO: save phone number  

  // ctx.replyKeyboardRemove
  const extra = Telegraf.Extra.markup((markup) => {
      return Markup.removeKeyboard()
    })
  ctx.reply(VOX.phoneRegistered, extra)
}

function getLocation() {
  // markup.locationRequestButton('Send location')
}

//---- ACTIONS

async function sayAbout(ctx, data) {
  ctx.replyWithMarkdown(VOX.aboutText.parse(VERSION))
}

async function sayHelp(ctx, data) {
  // TODO: show trading help
  ctx.replyWithMarkdown(VOX.helpText)
}

async function sayRegister(ctx, data) {
  console.log(`--> Register ${data.userid}`)
  // Validate name
  const parts = await parseText(data.userid, data.message, data.action)
  const name = parts.name
  console.log('Register new account for', name)
  if(!name || name.trim()===''){
    ctx.reply(VOX.noNameProvided) 
    return 
  }
  
  // Check account does not exist
  let account = null
  try { account = await db.getAccount(data.userid) }
  catch(ex) { console.log(ex); ctx.reply(VOX.errorAccessingDatabase); return }
  if (account!==null) { 
    if(account.usercase===name.toLowerCase()){ 
      ctx.reply(VOX.alreadyRegisteredWelcome.parse(account.username))
      return 
    }
    ctx.reply(VOX.alreadyRegisteredName.parse(account.username))
    return 
  }

  // Check name is valid
  const chars = /^[A-Za-z0-9]+$/i
  const first = /^[A-Za-z]+$/i
  if(!chars.test(name))    { 
    console.error('Invalid characters in name') 
    ctx.reply(VOX.invalidName) 
    return
  }
  if(!first.test(name[0])) { 
    console.error('Invalid first char in name') 
    ctx.reply(VOX.invalidNameFirstChar) 
    return
  }
  if(name.length>30) { 
    console.error('Invalid name is more than 30 chars') 
    ctx.reply(VOX.invalidNameLength) 
    return
  }

  // Check name is not taken
  let text = '?'
  const okCheck = await db.checkName(name)
  if (!okCheck) {
    text = VOX.nameTaken.parse(name)
    console.error(text)
    ctx.reply(text)
    return
  }
  text = VOX.newAccount
  ctx.reply(text)

  console.log('Registering account...')
  const result = await blockchain.newAccount()
  //console.log('Result', result)

  if(result.error){
    if(result.type==='generate'){ ctx.reply(VOX.errorOpening);     return }
    if(result.type==='fund'    ){ ctx.reply(VOX.errorFunding);     return }
    if(result.type==='deploy'  ){ ctx.reply(VOX.errorRegistering); return }
  }

  const record = {
    userid:   data.userid,
    username: name,
    usercase: name.toLowerCase(),
    account:  result.addressHex,
    secret:   result.privateKeyHex,
    network:  network
  }
  console.log('RECORD', record.userid)
  let recId = 0
  try {
    recId = await db.newAccount(record)
    console.log('ID', recId)
  } catch(ex) {
    console.error(ex)
    ctx.reply(VOX.errorOpening)
    return
  }

  if(recId>0){ 
    console.log('--- New account', result?.addressHex ?? '?')
    text = VOX.welcomeHelp
  } else {
    console.error('Error registering account')
    text = VOX.errorRegistering
  }
  
  ctx.reply(text)
}

async function sayHello(ctx, data) {
  console.log(`--> ${data.userid} Hello`)
  ctx.reply(VOX.welcomeApp)
}

// Show account and qrcode
async function sayAccount(ctx, data) {
  console.log(`--> ${data.userid} Account`)
  let text = 'Account?'

  // Check account does exist
  const account = await db.getPublicKey(data.userid)

  if (account==null) {
    // User does not exist? What?
    console.error('Error searching for account '+data.userid)
    text = VOX.errorSearching
    ctx.reply(text)
  } else {
    text = account
    qurl = 'https://kuyawa.net/qrcode/?q=' + text
    ctx.replyWithPhoto({ url: qurl }, { caption: text })
  }
}

async function sayName(ctx, data) {
  const parts = await parseText(data.userid, data.message, data.action)
  const name = parts.name
  let text = 'Name?'
  
  // Check account does exist
  let account = null
  try { account = await db.getAccount(data.userid) }
  catch(ex) { console.log(ex); ctx.reply(VOX.errorAccessing); return }
  if (account==null) { ctx.reply(VOX.accountNotFound); return }

  // If no name to set, then show current name
  if(!name || name==='') {
    if(!account.username || account.username==='') {
      text = VOX.noNameYet
    } else {
      text = VOX.yourNameIs.parse(account.username)
    }
  } else {
    // Check name is valid
    const chars = /^[A-Za-z0-9]+$/i
    const first = /^[A-Za-z]+$/i
    if(!chars.test(name))    { 
      console.error('Invalid characters in name') 
      ctx.reply(VOX.invalidName) 
      return
    }
    if(!first.test(name[0])) { 
      console.error('Invalid first char in name') 
      ctx.reply(VOX.invalidNameFirstChar) 
      return
    }
    if(name.length>30) { 
      console.error('Invalid name more than 30 chars') 
      ctx.reply(VOX.invalidNameLength) 
      return
    }

    // console.log(name)
    // Check name is not taken
    const okCheck = await db.checkName(name)
    if (okCheck) {
      const okSave = await db.saveName(data.userid, name)
      if(okSave) {
        text = VOX.nameSet.parse(name)
      } else {
        text = VOX.errorRegisteringName
      }
    } else {
      text = VOX.nameTaken.parse(name)
    }
  }

  ctx.reply(text)
}

// Get account balance
async function sayBalance(ctx, data) {
  let text = ''
  const publicKey = await db.getPublicKey(data.userid)
  if(!publicKey){ ctx.reply(VOX.accountNotFound); return }
  const result = await blockchain.getBalance(publicKey)
  const tokens = await blockchain.getTokenBalances(publicKey)
  if(result) {
    const balance = result.toFixed(4)
    text = `${VOX.yourBalanceIs}: *${balance} ${CURRENCY}*`
    for(symbol in tokens){
      text += `*${tokens[symbol]} ${symbol.toUpperCase()}*`
    }
  } else {
    text = VOX.errorContactingServer
  }
  ctx.replyWithMarkdown(text)
}

async function sayHistory(ctx, data) {
  //ctx.reply('History not available yet'); return;

  let text = ''
  const address = await db.getPublicKey(data.userid)
  if(!address){ 
    console.error('Error accessing history')
    ctx.reply('Error accessing history') 
    return
  }

  const recs = await blockchain.getHistory(address)
  //console.log(data)
  const info = {history:[], text:[], error:null}

  for (let i=0; i<recs.length; i++) {
    const tx = recs[i]
    if(tx.value===0){ continue }
    const item = {
        label    : 'Payment',
        id       : tx.id,
        hash     : tx.hash,
        time     : tx.time,
        fees     : tx.fees,
        type     : (tx.to===address ? 'rec' : 'pay'),
        typex    : (tx.to===address ? 'Rec' : 'Pay'),
        from     : tx.from,
        to       : tx.to,
        asset    : CURRENCY, // TODO: it may be BRL
        amount   : utils.money(tx.value, 4),
        address  : '',
        color    : ''
    }
    if(tx.fees === 0) { item.typex = 'New'; /*item.type = 'new'*/ }
    item.address = (item.type==='pay' ? item.to : item.from)
    item.color   = item.type
    info.history.push(item)
  }
  if(info.error) {
    console.error(info.error)
    text = '*Error*: server unavailable, try again later'
    ctx.replyWithMarkdown(text)
    return
  }

  // Assign name to account
  const list = []
  let line = 0
  for (line=0; line<info.history.length; line++){
    list.push(info.history[line].address)
  }
  const users = await db.getUsersByAccount(list)
  const accts = {}
  for (line=0; line<users.length; line++) { accts[users[line].account] = users[line].username; }
  const hist = []
  for (let rec=0; rec<info.history.length; rec++) { 
    item = info.history[rec]
    if(!item.type){ continue }
    let name = accts[item.address]
    if(!name) { 
      if(!item.address) { name = '?' }
      else { name = item.address.substr(0,8) }
    }
    if(item.type==='new') {
      line = 'New account '+Number.parseFloat(item.amount).toFixed(4)+' '+item.asset
    } else {
      line = item.typex+' '+Number.parseFloat(item.amount).toFixed(4)+' '+item.asset+' '+(item.type==='pay' ? 'to  ' : 'from')+' '+name
    }
    hist.push(line)
  }
  text = '*Last 10 transactions*\n' + '`' + hist.join('\n').replaceAll('_','-') + '`'

  ctx.replyWithMarkdown(text)
}

async function getPrice(asset) {
  const onehour = 3600000 // millis
  const now = (new Date()).getTime()
  let price = 0
  let ok = false

  try {
    // Update currencies and cryptos every hour
    // Get currencies and cryptos records from db
    // if updated < now-1hour then get new data else use data from record
    let update = false
    let prices = await db.getPrices()
    //console.log(prices.updated)
    //console.log('Prices: ',prices)
    if(!prices){ 
      update = true
      prices = {currencies:[], cryptos:[]}
      console.error('DB Error accessing prices')
    } else {
      if(prices.updated < now-onehour){ update = true }
    }
    //console.log('Update: ',update)
    //console.log(((onehour - (now - prices.updated))/60000).toFixed(0), 'mins to update')
    //update = true // REMOVE

    if(update) {
      prices = { currencies:{}, cryptos:{} }
      let symbol   = null
      let price    = null

      //---- CRYPTOS
      // Fetch and save, build prices list
      //const url = 'https://api.coinmarketcap.com/v1/ticker/?limit=100'
      //const url = 'https://api.binance.com/api/v1/ticker/24hr?symbol='+asset+'USDT'
      const list1 = await web.getApi('https://api.binance.com/api/v1/ticker/24hr')
      if(list1) {
        ok = true
        for(item in list1) {
          symbol = list1[item].symbol
          price  = list1[item].lastPrice
          if(symbol?.endsWith('USDT')){
            const coin = symbol.substr(0, symbol.length - 4)
            prices.cryptos[coin] = price
          }
        }
      } else {
        console.error("Price NO JSON")
        ok = false
        prices.cryptos = {}
      }
      ok = await db.saveText('cryptos', JSON.stringify(prices.cryptos))

      //---- CURRENCIES
      const list2 = await web.getApi('https://openexchangerates.org/api/latest.json?app_id='+OPENEXKEY)
      if(list2) {
        ok = true
        for(item in list2.rates) { 
          symbol = item
          price  = list2.rates[item]
          prices.currencies[symbol] = price
        }
      } else {
        console.error("Price NO JSON")
        ok = false
        prices.currencies = {}
      }

      //console.log(prices)
      ok = await db.saveText('currencies', JSON.stringify(prices.currencies))
    }

    // TODO: Check pairs for market price
    price = prices.currencies[asset]
    if(asset==='BTC') { price = null } // Skip btc in currencies, check as crypto
    if (!price){
      const market = asset //+'USDT' // TODO: market pair any/any
      price = prices.cryptos[market]
      console.log('PRICE', market, price)
    }
    ok = true
  } catch (ex) {
    console.error("Price ERROR:", ex)
    ok = false
    price = 0
  }
  return {ok:ok, asset:asset, price:price}
}

async function sayPrice(ctx, data) {
  const parts  = await parseText(data.userid, data.message, data.action)
  const result = await getPrice(parts.asset)
  //console.log(result)
  let text = ''
  if(result.ok && result.price > 0){
    text = result.asset + ': ' + utils.priceFormat(result.price)
  } else {
    text = 'Price not available'
  }
  ctx.reply(text)
}

async function webPayment(sourceSecret, destinSecret, asset, amount, ref) {
  return {ok:false, error:'Not ready'}
}

async function sendPayment(ctx, data) {
  try {
    const parts  = await parseText(data.userid, data.message, data.action)
    if(data.message.trim().toLowerCase() === 'pay'){
      const help = '*pay*: send money to Paysapp users\n\n'+
        '```'+
        'pay 100 to George\n'+
        'pay 150 BTC to Caroline\n'+
        'pay 200 USD to Walmart ref 123456\n\n'+
        '```'+
        '_Note: refs are useful for tracking payments to specific orders_ \n\n'

      ctx.replyWithMarkdown(help)
      return
    }

    // TODO:
    // - check message is well formed
    // - check receiver is well formed
    // - check receiver exists
    // - check receiver has trustline to asset
    // - check sufficient balance
    // - check asset is available
    // - check amount is well formed

    // TODO: validate amount with comma instead of dot
    let amount = parts.amount
    if(Number.isNaN(amount)) { 
      amount = amount.replace(',', '.')
      if(Number.isNaN(amount)) { 
        console.error('Invalid amount '+parts.amount) 
        ctx.reply('Invalid amount '+parts.amount) 
        return
      }
    }
    //console.log({amount})
    const receiver = parts.receiver.toLowerCase()
    //console.log({receiver})
    // TODO: Check if receiver is id, phone, name or account
    // if phone, check if country code inluded else prepend
    // Use name only for now

    //console.log('Payment to '+receiver)

    const sender = await db.getAccount(parts.sender)
    //console.log({sender})
    //console.log(sender)
    if(!sender){ 
      console.error('Sender not found '+parts.sender) 
      ctx.reply(VOX.notRegistered) 
      return
    }
    let name = sender.username
    if (!name || name==='') { name = sender.userid.substr(8) }  // phone?
    //console.log({name})

    const rcvacct = await db.getAccountByName(receiver)
    //console.log({rcvacct})
    //var destin  = await db.getPublicKey(receiver) // check userid
    if(!rcvacct) { 
      console.error('Destination account not found') 
      ctx.reply(VOX.destinationNotFound) 
      return
    }
    const destin = rcvacct.account
    //console.log({destin})
    const userid = rcvacct.userid.substr(9) // remove telegram:
    //console.log({destin})
    if(!destin) { 
      console.error('Destination userid not found') 
      ctx.reply(VOX.destinationNotFound) 
      return
    }

    // TODO: Validate data for a payment tx
    const reference = parts.reference
    const source    = sender.account
    const secret    = sender.secret
    const asset     = parts.asset ?? CURRENCY
    //console.log({reference, source, asset})
    //console.log(source, secret, destin, asset, amount, ref)
    let text = ''
    let resp = {ok: false, error:'', retry: false}
      
    // PAYMENT
    console.log('Paying...', {source, destin, amount, asset, reference})
    if(asset==='BRL'){
      //const jettonContract = 'EQDRXnCTrcL4MgLtk7tHOL-4mgukzxL1oPOs5vG5Bc6MHAPH' // BRL CONTRACT NO
      const jettonContract = 'EQDBHjStPWjsFPb9oP0vtgzX2Mf-XpU6v77KjUX6n59jZrX1' // BRL MASTER
      resp = await blockchain.sendTokens({symbol:asset, jettonContract, receiver:destin, amount, privateKey:secret, message:reference}) // no wait
    } else {
      resp = await blockchain.sendPayment({secret, source, destin, amount, asset, message:reference}) // no wait
    }
    console.log('Result', resp)
    if(resp.success) {
      // Inform sender
      text = VOX.paymentSentNotConfirmed
      ctx.reply(text)

      // Inform receiver
      //let msg = 'Payment of '+amount+' '+asset+' received from '+name
      let msg = VOX.paymentReceived.parse(amount, asset, name)
      if(reference && reference!==''){ msg += ' ref '+reference }
      const app = rcvacct.userid.split(':')[0]
      if(app==='telegram') {
        ctx.telegram.sendMessage(userid, msg)  // send message to receiver
      } else {
        //sendExternal(INBOXURL, INBOXKEY, app, sender.userid, sender.username, rcvacct.userid, rcvacct.username, msg)
      }
      console.log('--Done')

      // Wait for confirmation
      blockchain.waitForConfirmation(source, resp.prevHash).then(ok=>{
        console.log('Confirmed', ok)
        text = ok ? VOX.paymentConfirmed : VOX.paymentFailed
        ctx.reply(text) // inform sender
        if(app==='telegram') {
          ctx.telegram.sendMessage(userid, text)  // inform receiver
        } else {
          //sendExternal(INBOXURL, INBOXKEY, app, sender.userid, sender.username, rcvacct.userid, rcvacct.username, msg)
        }
      })
    } else {
      text = 'Error: '+resp.error
      ctx.reply(text)
    }
  } catch(ex) {
    console.error(ex)
    ctx.reply('Error sending payment')
  }
}




//---- MORE STUFF HERE



async function saySomething(ctx, data) {
  const words = data.message.trim().split(/\s+/)
  if(words[0][0]!=='@'){ console.log('Nothing to say'); return }
  const receiver = words[0].slice(1)
  const message  = words.slice(1).join(' ')

  let source = null
  try { source = await db.getAccount(data.userid) }
  catch(ex) { console.log(ex); ctx.reply(VOX.errorAccessingDatabase); return }
  if (source==null) { ctx.reply(VOX.errorAccessing); return }
  
  let destin = null
  try { destin = await db.getAccountByName(receiver) }
  catch(ex) { console.log(ex); ctx.reply(VOX.errorAccessingDatabase); return }
  if (destin==null) { ctx.reply(VOX.destinationNotFound); return }
  
  const msg = `${source.username}: ${message}` 
  const app = destin.userid.split(':')[0]
  
  if(app==='telegram') {
    ctx.telegram.sendMessage(destin.userid, msg)  // send message to receiver
  } else {
    //sendExternal(INBOXURL, INBOXKEY, app, source.userid, source.username, destin.userid, destin.username, msg)
  }
  ctx.reply(VOX.messageDelivered)
}

async function sayTest(ctx, data) {
  const resp = await db.test()
  ctx.reply(`${VOX.testOk}: ${resp}`)
}

async function sayInvalid(ctx, data) {
  console.log('Invalid action', data.userid, data.message)
  ctx.reply(VOX.invalidAction.parse(data.action))
}

module.exports = {
  onHelp,
  onContact,
  getPrice,
  parse
}

// END