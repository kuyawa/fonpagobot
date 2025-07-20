// BLOCKCHAIN

const { TonClient, WalletContractV4, Address, internal, external, comment, fromNano, toNano } = require('@ton/ton')
const { keyPairFromSeed, mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto')
const { beginCell, SendMode, storeMessage, storeMessageRelaxed } = require('@ton/core')
const utils = require('./utils')
const web = require('./web')

const network  = process.env.NETWORK   || 'testnet'
const netflag  = (network==='testnet')
const bankKey  = process.env.BANKKEY   || ''
const apiKey   = process.env.TONWEBKEY || ''
const rpcUrl   = network==='mainnet' ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC'
const apiUrl2  = network==='mainnet' ? 'https://toncenter.com/api/v2/' : 'https://testnet.toncenter.com/api/v2/'
const apiUrl3  = network==='mainnet' ? 'https://toncenter.com/api/v3/' : 'https://testnet.toncenter.com/api/v3/'
const tokenBRL = process.env.BRLMASTER

async function sleep(seconds=5){
  await new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

async function newAccount(){
  try {
    // GENERATE ACCOUNT
    console.log('Generating account...')
    const account = await generateAccount()
    if(!account){ return { error: 'Error creating account', type:'generate' } }
    const newWallet = WalletContractV4.create({ workchain: 0, publicKey: account.publicKey })

    // FUND FROM BANK
    //const bankWallet = getBankWallet()
    const bankSeed   = Uint8Array.from(Buffer.from(bankKey, 'hex'))
    const bankPair   = keyPairFromSeed(bankSeed)
    const bankWallet = WalletContractV4.create({ workchain: 0, publicKey: bankPair.publicKey })
    console.log('Bank', bankWallet.address.toString())
    const client     = new TonClient({ endpoint: rpcUrl, apiKey })
    const banker     = client.open(bankWallet)
    const seqno      = await banker.getSeqno() || 0
    const receiver   = account.addressHex
    const amount     = '0.025'
    const message    = 'Funds'
    //console.log('Bank', bankWallet.address.toString())
    const operation = internal({
      to:     receiver,    // Receiver address
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
      value: '0.01',      // TON amount for deployment
      init: newWallet.init,
      body: beginCell().endCell(), // Empty body
      //body: 'Active',
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
    const deployed = await waitForStatus(receiver, 20)
    console.log('Deployed', deployed)
    if(!deployed){ return { error: 'Error deploying account', type:'deploy' } }
    
    // Send 100 BRL
    const sent = await sendTokens({
      amount: '100',
      symbol: 'BRL',
      jettonContract: tokenBRL,
      receiver,
      privateKey: bankKey,
      message: ''
    })

    return account
  } catch(ex) {
    console.error(ex?.message)
    return {error:ex?.message ?? 'Unknown'}
  }
}

// Internal
async function generateAccount(){
  try {
    let counter = 0
    while(counter < 100){
      counter += 1
      const mnemonics     = await mnemonicNew()
      const keyPair       = await mnemonicToPrivateKey(mnemonics)
      const wallet        = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey })
      const address       = wallet.address
      const addressHex    = wallet.address.toString() // {urlSafe: true, testOnly:true, bounceable:false}
      if(addressHex.indexOf('-')>-1 || addressHex.indexOf('_')>-1){ // I hate them
        //console.log('Bad address:', addressHex)
        continue
      }
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
    }
  } catch(ex) {
    console.error(ex?.message)
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
    const wallet = WalletContractV4.create({ workchain:0, publicKey:keyPair.publicKey })
    const address = await wallet.address.toString()
    return { address, publicKey, privateKey, secretKey }
  } catch(ex) {
    console.error(ex?.message)
  }
  return null
}

async function getBankWallet(){
  try {
    const bankSeed = Uint8Array.from(Buffer.from(bankKey, 'hex'))
    const bankPair = keyPairFromSeed(bankSeed)
    // Create bank wallet
    // TODO: Change to v4 and move funds
    const bankWallet = WalletContractV4.create({
      workchain: 0, // 0 for basechain, -1 for masterchain
      publicKey: bankPair.publicKey
    })
    //bankWallet.secretKey  = bankPair.secretKey
    //bankWallet.addressHex = bankWallet.address.toString()
    //console.log('Bank', bankWallet)
    return bankWallet
  } catch(ex) {
    console.error(ex?.message)
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
    //console.log('> BALANCE', balance)
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
  console.log('WAIT FOR STATE', address)
  let counter = 0
  while (counter < retries) {
    counter += 1
    const state = await getAccountState(address)
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
  console.log('WAIT FOR CONFIRMATION', address, prevHash)
  let counter = 0
  while (counter < retries) {
    counter += 1
    console.log('TRY CONFIRM', counter)
    const tx = await getLastTransaction(address)
    const lastHash = utils.base64tohex(tx?.hash||'')
    // compare if last tx is still prev-hash until we get new-hash
    //console.log('Tx hash', lastHash)
    if(lastHash!==prevHash){
      const tx2 = await getTransactionV2(address, lastHash)
      const hash2 = tx2?.transaction_id?.hash
      //console.log('Tx hash2', hash2)
      while (counter < retries) {
        counter += 1
        console.log('TRY STATE', counter)
        const state = await getTransactionState(address, hash2)
        //console.log('Tx State', state, hash2)
        if(state===undefined){
          //console.log('Tx undefined', tx2)
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
    }
    await sleep(5)
  }
  console.log('Not confirmed')
  return false
}

async function getBalance(address){
  //console.log('GET BALANCE', address)
  //const url = apiUrl3 + 'addressInformation?address=' + address
  //const result = await web.getApi(url)
  //const url = apiUrl2 + 'addressInformation?address=' + address
  const payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAddressBalance",
    "params": {
      "address": address
    }
  }
  const result = await web.postApi(rpcUrl, payload)
  //console.log('RESULT', result)
  let balance = null
  if(result) {
    balance = Number.parseInt(result?.result || '0') / 10**9
    //balance = Number.parseInt(result?.balance || '0') / 10**9
  }
  //console.log(address, balance)
  return balance
}

async function getTokenBalance(address, jetton){
  const url     = `${apiUrl3}jetton/wallets?owner_address=${address}&jetton_address=${jetton}`
  const result  = await fetch(url)
  const data    = await result.json()
  const wallet  = data.jetton_wallets[0]
  const balance = wallet.balance/10**9
  //const meta = data.metadata[wallet.jetton].token_info[0]
  //const symbol = meta.symbol
  return balance
}

async function getTokenBalances(address){
  const url     = `${apiUrl3}jetton/wallets?owner_address=${address}`
  const result  = await fetch(url)
  const data    = await result.json()
  const balances = {}
  for(wallet of data.jetton_wallets){
    const balance = wallet.balance/10**9
    const meta = data.metadata[wallet.jetton].token_info[0]
    const symbol = meta.symbol
    balances[symbol] = balance
  }
  //console.log(address, balances)
  return balances
}

/*
async function getBalances(address) {
  const url = apiUrl3 + 'addressInformation?address=' + address
  const result = await web.getApi(url)
  const balance = (inf?.balance || 0) / 10**9
  // TODO: list assets
  //console.log(address, balance)
  return balance
}
*/

async function getAccountState(address){
  //console.log('GET STATE', address)
  //const url = apiUrl3 + 'addressInformation?address=' + address
  //const info = await web.getApi(url)
  //const state = info.status
  //console.log(address, state)
  const payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAddressState",
    "params": {
      "address": address
    }
  }
  const result = await web.postApi(rpcUrl, payload)
  //console.log('RESULT', result)
  let state = null
  if(result) {
    state = result.result // active
  }
  //console.log(address, state)
  return state
}

// Long hash, no state
async function getTransactionV2(address, hash){
  //console.log('GET TRANSACTION v2', address, hash)
  const url = `${apiUrl2}getTransactions?address=${address}&hash=${hash}&limit=1`
  const info = await web.getApi(url)
  //console.log('RESULT', info)
  const tx = info.result?.[0] ?? null
  //const tx = info.transactions?.[0] ?? null
  //console.log('TX2', tx)
  return tx
}

// Short hash, returns description.state
async function getTransactionV3(address, hash){
  //console.log('GET TRANSACTION v3', address, hash)
  const url = `${apiUrl3}transactions?hash=${encodeURIComponent(hash)}`
  //console.log('URL v3', url)
  const info = await web.getApi(url)
  //console.log('RESULT', info)
  const tx = info.transactions?.[0] ?? null
  //console.log('TX3', tx)
  return tx
}

async function getTransactionRPC(address, hash){
  //console.log('GET TRANSACTION RPC', address, hash)
  //const url = apiUrl3 + 'transactions?hash=' + hash
  //const info = await web.getApi(url)
  //console.log('TX', info)
  const payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransactions",
    "params": {
      "address": address,
      "hash": hash,
      "limit": 1
    }
  }
  const result = await web.postApi(rpcUrl, payload)
  const tx = result.result?.[0] ?? null
  //console.log('TXR', tx)
  return tx
}

async function getLastTransaction(address){
  const txs = await getHistory(address, 1)
  const tx  = txs?.length > 0 ? txs[0] : null
  return tx
}

// Short base64 hash
async function getTransactionState(address, hash){
  //console.log('GET TRANSACTION STATE', address, hash)
  const tx = await getTransactionV3(address, hash)
  //console.log('TX', tx)
  const state = tx?.description?.action?.success
  //const code = tx?.description?.compute_ph?.exit_code // if !== 0 then failed
  //console.log('STATE', state)
  return state
}

async function getHistory(address, limit=10){
  try {
    const url  = `${apiUrl2}getTransactions?address=${address}&limit=${limit}`
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
      //console.log(it.in_msg?.value)
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
      if(it?.in_msg?.value!=='0'){
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
      }
      return {
        time: new Date(it.utime*1000),
        hash: it.transaction_id?.hash, 
        //state: it.description?.action?.success,
        //fees: {base: it.fee||0, storage: it.storage_fee||0, other: it.other_fee||0 },
        fees: Number.parseInt(it.fee||'0') +  Number.parseInt(it.storage_fee||'0') + Number.parseInt(it.other_fee||'0'),
        from: it.in_msg?.source ?? '', 
        to: it.in_msg?.destination ?? '', 
        value: 0,
        message: 'Error'
      }
    })
    //console.log(info)
    return info
  } catch(ex) {
    console.error(ex?.message)
  }
  return null
}


async function getContract(privateKey){
  try {
    const seed = Uint8Array.from(Buffer.from(privateKey, 'hex'))
    const keyPair = keyPairFromSeed(seed)
    const wallet = WalletContractV4.create({ workchain:0, publicKey:keyPair.publicKey })
    const client = new TonClient({ endpoint: rpcUrl, apiKey })
    const contract = client.open(wallet)
    return contract
  } catch(ex) {
    console.error(ex?.message)
    return null
  }
}

async function getWallet(privateKey){
  try {
    const seed = Uint8Array.from(Buffer.from(privateKey, 'hex'))
    const keyPair = keyPairFromSeed(seed)
    const wallet = WalletContractV4.create({ workchain:0, publicKey:keyPair.publicKey })
    return wallet
  } catch(ex) {
    console.error(ex?.message)
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
    const client = new TonClient({ endpoint: rpcUrl, apiKey })
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
      confirmed = await waitForConfirmation(source, prevHash, 20)
    }
    //// TODO: parse tx and send id, time, etc
    return {success: sent, confirmed, prevHash}
  } catch (ex) {
    console.error(ex?.message)
    return {success: false, confirmed: false, error: error.message}
  }
}

// Needs ton client loaded with rpcurl and apikey
// USE: sendTokens({symbol, jettonContract, receiver, amount, privateKey})
async function sendTokens({symbol, jettonContract, receiver, amount, privateKey, message}){
  console.log('Sending token:', {symbol, jettonContract, receiver, amount, privateKey, message})
  const client = new TonClient({ endpoint: rpcUrl, apiKey })

  async function getUserJettonWalletAddress(userAddress, jettonMasterAddress) {
    const userAddressCell = beginCell().storeAddress(Address.parse(userAddress)).endCell()
    const response = await client.runMethod(Address.parse(jettonMasterAddress), 'get_wallet_address', [
      { type: 'slice', cell: userAddressCell },
    ])
    const address = response.stack.readAddress()
    console.log('Jetton Address:', address)
    return address
  }

  try {
    const toAddress  = Address.parse(receiver)
    const seed       = Uint8Array.from(Buffer.from(privateKey, 'hex'))
    const keyPair    = keyPairFromSeed(seed)
    const secretKey  = Buffer.from(keyPair.secretKey)
    const publicKey  = Buffer.from(keyPair.publicKey)
    const workchain  = 0 // Usually you need a workchain 0
    const wallet     = WalletContractV4.create({ workchain, publicKey })
    const address    = wallet.address.toString({ urlSafe: true, bounceable: true, testOnly: true })
    const contract   = client.open(wallet)
    const balance    = 0
    //const balance    = await contract.getBalance()
    // TODO: Check if enough balance for transaction 
    // if(Number(balance) < amount) {...}
    const seqno      = await contract.getSeqno()
    const isDeployed = await client.isContractDeployed(Address.parse(address))
    //console.log({ address, balance, seqno, isDeployed })
    if(!isDeployed){
      console.log('Account not deployed', address)
      return {success:false, error:'Account not deployed'}
    }

    const neededInit = null
    //const { init } = contract
    //if (init && !isDeployed) {
    //  neededInit = init
    //}
    const jettonWalletAddress = await getUserJettonWalletAddress(address, jettonContract)
    //const jettonWalletAddress = jettonContract

    // Message payload
    let hasMessage = 0
    let messagePayload = beginCell().endCell()
    if(message){
      hasMessage = 1
      messagePayload = beginCell()
        .storeUint(0, 32) // 0 opcode means we have a comment
        .storeStringTail(message)
        .endCell()
    }

    const messageBody = beginCell()
      .storeUint(0x0f8a7ea5, 32)  // opcode for jetton transfer
      .storeUint(0, 64)           // query id
      .storeCoins(toNano(amount)) // jetton amount, amount * 10^9
      .storeAddress(toAddress)    // destination
      .storeAddress(toAddress)    // response destination
      .storeBit(0)                // no custom payload
      .storeCoins(0)              // forward amount - if > 0, will send notification message
      .storeBit(hasMessage)       // we store forwardPayload as a reference, set 1 and uncomment next line for have a comment
      .storeRef(messagePayload)   // message payload
      .endCell()

    const fees = '0.05' // 0.1 to be sure
    const internalMessage = internal({
      to: jettonWalletAddress,
      value: toNano(fees), // base fee for jetton transfer
      bounce: true,
      body: messageBody,
    })

    const body = wallet.createTransfer({
      seqno,
      secretKey,
      messages: [internalMessage],
    })

    const externalMessage = external({
      to: address,
      init: neededInit,
      body,
    })

    const externalMessageCell = beginCell().store(storeMessage(externalMessage)).endCell()
    const signedTransaction   = externalMessageCell.toBoc()
    const hash = externalMessageCell.hash().toString('hex')
    console.log('hash:', hash)
    await client.sendFile(signedTransaction)
    // Should we check for confirmation?
    return {success: true, hash}
  } catch(ex) {
    console.error(ex?.message)
    return {success:false, error:ex.message}
  }
}

module.exports = {
  generateAccount,
  getAccount,
  getBalance,
  getTokenBalance,
  getTokenBalances,
  getHistory,
  getAccountState,
  getTransactionV2,
  getTransactionV3,
  getTransactionRPC,
  getTransactionState,
  newAccount,
  sendPayment,
  sendTokens,
  waitForConfirmation
}
