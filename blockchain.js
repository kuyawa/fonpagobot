// BLOCKCHAIN

const { TonClient, WalletContractV3R1, internal, comment, fromNano, toNano } = require('@ton/ton')
const { keyPairFromSeed, mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto')
const { beginCell, SendMode, storeMessageRelaxed } = require('@ton/core')
const utils = require('./utils')
const web = require('./web')

const network = process.env.NETWORK   || 'testnet'
const netflag = (network==='testnet')
const bankKey = process.env.BANKKEY   || ''
const apiKey  = process.env.TONWEBKEY || ''
const apiUrl  = network==='mainnet' ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC'
const rpcUrl2 = network==='mainnet' ? 'https://toncenter.com/api/v2/' : 'https://testnet.toncenter.com/api/v2/'
const rpcUrl3 = network==='mainnet' ? 'https://toncenter.com/api/v3/' : 'https://testnet.toncenter.com/api/v3/'

async function sleep(seconds=5){
  await new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

async function newAccount(){
  try {
    // GENERATE ACCOUNT
    console.log('Generating account...')
    const account = await generateAccount()
    if(!account){ return { error: 'Error creating account', type:'generate' } }
    const newWallet = WalletContractV3R1.create({ workchain: 0, publicKey: account.publicKey })

    // FUND FROM BANK
    //const bankWallet = getBankWallet()
    const bankSeed   = Uint8Array.from(Buffer.from(bankKey, 'hex'))
    const bankPair   = keyPairFromSeed(bankSeed)
    const bankWallet = WalletContractV3R1.create({ workchain: 0, publicKey: bankPair.publicKey })
    const client     = new TonClient({ endpoint: apiUrl, apiKey })
    const banker     = client.open(bankWallet)
    const seqno      = await banker.getSeqno() || 0
    const receiver   = account.addressHex
    const amount     = '0.025'
    const message    = 'Funds'
    //console.log('Bank', bankWallet.address.toString())
    const operation = internal({
      to:     receiver,  // Receiver address
      value:  amount,      // Amount of TON, attached to transfer
      body:   message,     // Transfer will contain comment
      bounce: false        // True for contracts, false for wallets
    })
    const payment = {
      seqno,
      secretKey: bankPair.secretKey,
      messages: [operation],
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS
    }
    //console.log('Payment', payment)
    const result = await banker.sendTransfer(payment)
    console.log('Payment sent')
    const funded = await waitForBalance(receiver, 30)
    console.log('Funded', funded)
    if(!funded){ return { error: 'Error funding account', type:'fund' } }

    // DEPLOY ACCOUNT
    const newSeq = 0
    const deployOp = internal({
      to: receiver,
      value: '0.02',      // TON amount for deployment
      init: newWallet.init,
      //body: beginCell().endCell(), // Empty body
      body: 'Active',
      bounce: false
    })
    const deployTx = {
      seqno: newSeq, // Get current seqno
      secretKey: account.secretKey,
      messages: [deployOp],
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS
    }
    //console.log('Deploy', deployTx)
    // Send the transfer
    const sender = client.open(newWallet)
    await sender.sendTransfer(deployTx)
    console.log('Deployment sent')
    //const tx = await newWallet.createTransfer(deployTx)
    //console.log('Deployment tx', tx)
    //const ok = await client.sendExternalMessage(newWallet, tx)
    //console.log('Deployment ok', ok)
    //await client.sendExternalMessage(newWallet, transfer)
    const deployed = await waitForStatus(receiver)
    console.log('Deployed', deployed)
    if(!deployed){ return { error: 'Error deploying account', type:'deploy' } }
    return account
  } catch(ex) {
    console.error(ex)
    return {error:ex.message}
  }
}

// Internal
async function generateAccount(){
  try {
    console.log('GENERATE')
    const mnemonics     = await mnemonicNew()
    const keyPair       = await mnemonicToPrivateKey(mnemonics)
    const wallet        = WalletContractV3R1.create({ workchain: 0, publicKey: keyPair.publicKey })
    const address       = wallet.address
    const addressHex    = wallet.address.toString() // {urlSafe: true, testOnly:true, bounceable:false}
    const secretKey     = keyPair.secretKey
    const publicKey     = keyPair.publicKey
    const halfKey       = keyPair.secretKey.slice(0, 32)
    const privateKey    = halfKey
    const publicKeyHex  = Buffer.from(keyPair.publicKey).toString('hex')
    const privateKeyHex = Buffer.from(halfKey).toString('hex')
    const secretKeyHex  = Buffer.from(keyPair.secretKey).toString('hex')
    const account = { address, addressHex, publicKey, privateKey, secretKey, publicKeyHex, privateKeyHex, secretKeyHex }
    console.log('Account', addressHex)
    return account
  } catch(ex) {
    console.error(ex)
  }
  return null
}

// if we need an Address object:
// const address = Address.parse('EQ123...')

async function getAccount(privateKey){
  try {
    const seed = Uint8Array.from(Buffer.from(privateKey, 'hex'))
    const keyPair = keyPairFromSeed(seed)
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex')
    //const secretKey = Buffer.from(keyPair.secretKey).toString('hex')
    const secretKey = keyPair.secretKey
    const wallet = WalletContractV3R1.create({ workchain:0, publicKey:keyPair.publicKey })
    const address = await wallet.address.toString()
    return { address, publicKey, privateKey, secretKey }
  } catch(ex) {
    console.error(ex)
  }
  return null
}

async function getBankWallet(){
  try {
    const bankSeed = Uint8Array.from(Buffer.from(bankKey, 'hex'))
    const bankPair = keyPairFromSeed(bankSeed)
    // Create bank wallet
    // TODO: Change to v4 and move funds
    const bankWallet = WalletContractV3R1.create({
      workchain: 0, // 0 for basechain, -1 for masterchain
      publicKey: bankPair.publicKey
    })
    //bankWallet.secretKey  = bankPair.secretKey
    //bankWallet.addressHex = bankWallet.address.toString()
    //console.log('Bank', bankWallet)
    return bankWallet
  } catch(ex) {
    console.error(ex)
  }
  return null
}

// Internal
async function waitForBalance(address, retries=10) {
  console.log('WAIT FOR BALANCE', address)
  let counter = 0
  while (counter < retries) {
    counter += 1
    console.log('TRY BALANCE', counter)
    const balance = await getBalance(address)
    console.log('> BALANCE', balance)
    if (balance > 0) {
      console.log('Balance detected:', balance, 'TON')
      return true
    }
    await sleep(5)
  }
  console.log('Not funded')
  return false
}

// Internal
async function waitForStatus(address, retries=10) {
  let counter = 0
  while (counter < retries) {
    counter += 1
    const state = await getState(address)
    console.log('TRY STATUS', counter, state)
    if (state==='active') {
      console.log('Account activated!')
      return true
    }
    await sleep(5)
  }
  console.log('Account not activated')
  return false
}

async function waitForConfirmation(address, prevHash, retries=10) {
  let counter = 0
  while (counter < retries) {
    counter += 1
    console.log('TRY CONFIRM', counter)
    const tx = await getLastTransaction(address)
    const lastHash = utils.base64tohex(tx?.hash||'')
    // compare if last tx is still prev-hash until we get new-hash
    if(lastHash!==prevHash){
      //console.log('Tx', tx)
      //console.log('Tx hash', tx.hash)
      const state = await getTransactionState(lastHash)
      console.log('Tx State', state, lastHash)
      if(state===undefined){ 
        console.log('Tx undefined', tx)
        await sleep(5)
        continue
      }
      if(state===true) {
        console.log('Tx confirmed')
        return true
      }
      console.log('Tx failed')
      return false
    }
    await sleep(5)
  }
  console.log('Not confirmed')
  return false
}

async function getBalance(address){
  console.log('GET BALANCE', address)
  //const url = rpcUrl3 + 'addressInformation?address=' + address
  //const result = await web.getApi(url)
  //const url = rpcUrl2 + 'addressInformation?address=' + address
  const payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAddressBalance",
    "params": {
      "address": address
    }
  }
  const result = await web.postApi(apiUrl, payload)
  console.log('RESULT', result)
  let balance = null
  if(result) {
    balance = Number.parseInt(result?.result || '0') / 10**9
    //balance = Number.parseInt(result?.balance || '0') / 10**9
  }
  console.log(address, balance)
  return balance
}

async function getBalances(address) {
  const url = rpcUrl3 + 'addressInformation?address=' + address
  const result = await web.getApi(url)
  const balance = (inf?.balance || 0) / 10**9
  // TODO: list assets
  //console.log(address, balance)
  return balance
}

async function getState(address){
  const url = rpcUrl3 + 'addressInformation?address=' + address
  const info = await web.getApi(url)
  const state = info.status
  //console.log(address, state)
  return state
}

async function getTransaction(hash){
  const url = rpcUrl3 + 'transactions?hash=' + hash
  const info = await web.getApi(url)
  //console.log('TX', info)
  const tx = info.transactions?.[0] ?? null
  return tx
}

async function getLastTransaction(address){
  const txs = await getHistory(address, 1)
  const tx  = txs?.length > 0 ? txs[0] : null
  return tx
}

async function getTransactionState(hash){
  const tx = await getTransaction(hash)
  //console.log('TX', tx)
  //const code = tx?.description?.compute_ph?.exit_code // if !== 0 then failed
  return tx?.description?.action?.success
}

async function getHistory(address, limit=10){
  try {
    const url  = `${rpcUrl2}getTransactions?address=${address}&limit=${limit}`
    const data = await web.getApi(url)
    //console.log('History', data.result.length)
    //console.log('History', JSON.stringify(data,null,2))
    if(!data?.result){
      console.log('No history for', address)
      return null
    }
    const info = data.result.map(it=>{
      // if  out_msgs is payment
      // if !out_msgs is receipt
      // if fees = 0 is new account
      // if extra_currencies is token
      if(it?.out_msgs?.length>0){
        return {
          time: new Date(it.utime*1000),
          hash: it.transaction_id?.hash, 
          //state: it.description?.action?.success,
          //fees: {base: it.fee||0, storage: it.storage_fee||0, other: it.other_fee||0 },
          fees: Number.parseInt(it.fee||'0') +  Number.parseInt(it.storage_fee||'0') + Number.parseInt(it.other_fee||'0'),
          from: it.out_msgs?.[0]?.source ?? '', 
          to: it.out_msgs?.[0]?.destination ?? '', 
          value: (it.out_msgs?.[0]?.value ?? 0) / 10**9,
          message: it.out_msgs?.[0]?.message ?? ''
        }
      }
      return {
        time: new Date(it.utime*1000),
        hash: it.transaction_id?.hash, 
        //state: it.description?.action?.success,
        //fees: {base: it.fee||0, storage: it.storage_fee||0, other: it.other_fee||0 },
        fees: Number.parseInt(it.fee||'0') +  Number.parseInt(it.storage_fee||'0') + Number.parseInt(it.other_fee||'0'),
        from: it.in_msg?.source ?? '', 
        to: it.in_msg?.destination ?? '', 
        value: (it.in_msg?.value ?? 0) / 10**9,
        message: it.in_msg?.message ?? ''
      }
    })
    //console.log(info)
    return info
  } catch(ex) {
    console.error(ex)
  }
  return null
}


async function getContract(privateKey){
  try {
    const seed = Uint8Array.from(Buffer.from(privateKey, 'hex'))
    const keyPair = keyPairFromSeed(seed)
    const wallet = WalletContractV3R1.create({ workchain:0, publicKey:keyPair.publicKey })
    const client = new TonClient({ endpoint: apiUrl, apiKey })
    const contract = client.open(wallet)
    return contract
  } catch(ex) {
    console.error(ex)
    return null
  }
}

async function getWallet(privateKey){
  try {
    const seed = Uint8Array.from(Buffer.from(privateKey, 'hex'))
    const keyPair = keyPairFromSeed(seed)
    const wallet = WalletContractV3R1.create({ workchain:0, publicKey:keyPair.publicKey })
    return wallet
  } catch(ex) {
    console.error(ex)
    return null
  }
}

async function sendPayment(data){
  let sent = false
  let confirmed = false
  try {
    //console.log('Data', data)
    const {secret, source, destin, amount, asset, message, wait=false} = data
    //const payload  = message || 'Fonpago Payment'
    const payload = message || ''
    const sender  = await getAccount(secret)  // sender
    //console.log('Sender', sender.address, source)
    if(!sender){ return {error:'Error sending payment'} }
    const wallet  = await getWallet(secret)   // sender
    //console.log('Wallet', wallet)
    const client = new TonClient({ endpoint: apiUrl, apiKey })
    const contract = client.open(wallet)
    const lastTx = await getLastTransaction(source)
    const prevHash = utils.base64tohex(lastTx?.hash??'')
    //console.log('prevHash', prevHash)
    const seqno = await contract.getSeqno()
    //console.log('Seqno', seqno)
    const operation = internal({
      to:     destin,  // Receiver address
      value:  amount,  // Amount of TON, attached to transfer
      body:   payload, // Transfer will contain comment
      bounce: false    // True for contracts, false for wallets
    })
    //const cell = beginCell().store(storeMessageRelaxed(operation)).endCell()
    //console.log(utils.toJSON(cell))
    //const cellHash = cell.hash().toString('hex')
    //console.log({cellHash})
    //return {error:'notready'}
    const payment = {
      seqno,
      secretKey: sender.secretKey,
      messages: [operation],
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    }
    //console.log('Payment', utils.toJSON(payment))
    //console.log('Payment', payment)
    //console.log('Payment', payment.messages[0].info)
    //const transfer = await wallet.createTransfer(payment)
    //const txHash = transfer.hash().toString('hex')
    //console.log('TXHash', txHash)
    const result = await contract.sendTransfer(payment)
    //console.log('Result', result)
    sent = true
    if(wait){
      confirmed = await waitForConfirmation(source, prevHash)
    }
    //// TODO: parse tx and send id, time, etc
    return {success: sent, confirmed, prevHash}
  } catch (error) {
    console.log('Error', error)
    return {success: false, confirmed: false, error: error.message}
  }
}

module.exports = {
  generateAccount,
  getAccount,
  getBalance,
  getHistory,
  getState,
  getTransaction,
  getTransactionState,
  newAccount,
  sendPayment,
  waitForConfirmation
}
