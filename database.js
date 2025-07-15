// TELEGRAM DATABASE MODULE

const security = require('./security.js')
const credentials = { connectionString: process.env.DATABASE }
//console.log(credentials)
const { Pool } = require('pg')
const pool = new Pool(credentials)

async function test() {
	let dbc = null
	let res = null
	let dat = null
  try {
		dbc = await pool.connect()
	  const sql = 'select now()'
  	res = await dbc.query(sql)
  	if(res.rowCount>0) { dat = res.rows[0] }
  } catch(ex) {
  	console.error(ex)
  } finally {
   	if (dbc) { dbc.release() }
  }
  return JSON.stringify(dat)
}

async function newAccount(account) { 
	const sql    = 'INSERT INTO accounts(userid, username, usercase, account, secret, network) values($1, $2, $3, $4, $5, $6) RETURNING recid'
	const params = [account.userid, account.username, account.usercase, account.account, security.encrypt(account.secret), account.network]
	let dbc  = null
	let res  = null
	let data = null

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		//console.log(res)
		if(res.rowCount>0) { data = res.rows[0].recid }
	} catch(ex) {
		console.log('DB error:', ex.message)
  } finally {
   	if (dbc) { dbc.release() }
  }
	
	return data
}

async function getAccount(userId) {
	const sql    = 'SELECT userid, username, usercase, currency, country, phone, account, secret, network, inactive from accounts where userid = $1'
	const params = [userId]
	let dbc  = null
	let res  = null
	let data = null

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rows.length>0) { 
			const row = res.rows[0]
			data = {
				userid   : row.userid,
				username : row.username,
				usercase : row.usercase,
				currency : row.currency,
				country  : row.country,
				phone    : row.phone,
				account  : row.account,
				secret   : security.decrypt(row.secret),
				network  : row.network,
				inactive : row.inactive
			}
		}
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}

async function getAccountByName(name) {
	const sql    = 'SELECT userid, username, usercase, currency, country, phone, account, secret, network, inactive from accounts where usercase = $1'
	const params = [name]
	let dbc  = null
	let res  = null
	let data = null

    try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rows.length>0) { 
			const row = res.rows[0]
			data = {
				userid   : row.userid,
				username : row.username,
				usercase : row.usercase,
				currency : row.currency,
				country  : row.country,
				phone    : row.phone,
				account  : row.account,
				secret   : security.decrypt(row.secret),
				network  : row.network,
				inactive : row.inactive
			}
		}
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}

async function getPublicKey(userId) {
	const sql    = 'SELECT account from accounts where userid = $1'
	const params = [userId]
	let dbc  = null
	let res  = null
	let data = null

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rowCount>0) { data = res.rows[0].account }
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}

async function getPublicKeyByName(name) {
	const sql    = 'SELECT account from accounts where usercase = $1'
	const params = [name.toLowerCase()]
	let dbc  = null
	let res  = null
	let data = null

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rowCount>0) { data = res.rows[0].account }
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}

async function getUserByName(name) {
	const sql    = 'SELECT userid from accounts where usercase = $1'
	const params = [name.toLowerCase()]
	let dbc  = null
	let res  = null
	let data = null

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rowCount>0) { data = res.rows[0].userid }
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}


async function checkName(name) {
	const sql    = 'SELECT usercase from accounts where usercase = $1'
	const params = [name.toLowerCase()]
	let dbc  = null
	let res  = null
	let ok   = false

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rowCount===0) { ok = true }  /* name available */
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return ok  // true if available
}


async function saveName(userId, name) {
	const sql    = 'UPDATE accounts set username = $1, usercase = $2 where userid = $3'
	const params = [name.trim(), name.trim().toLowerCase(), userId]
	let dbc = null
	let res = null
	let ok  = false

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rowCount>0) { ok = true }  /* name saved */
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return ok  // true if saved
}

async function getUsersByAccount(info) {
	const text = JSON.stringify(info)
	const list = text.slice(1,-1).replace(/"/g, "'")  // Remove brackets and replace quotes with ticks
	const sql  = 'Select userid, username, account From accounts Where account In ('+list+')'
	let dbc  = null
	let res  = null
	let data = null

  try {
		dbc = await pool.connect()
		res = await dbc.query(sql)
		if(res.rowCount>0) { 
			data = res.rows
		}
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}

async function getPrices() { 
	const sql1   = "SELECT name, text, updated from anydata where name = 'currencies'"
	const sql2   = "SELECT name, text, updated from anydata where name = 'cryptos'"
	const params = []
	let dbc   = null
	let res1  = null
	let res2  = null
	let data  = null
	let time1 = null
	let time2 = null

    try {
		dbc  = await pool.connect()
		res1 = await dbc.query(sql1)
		if(res1.rowCount>0) { 
			time1 = (new Date(res1.rows[0].updated)).getTime()
			currencies = JSON.parse(res1.rows[0].text) 
		}
		res2 = await dbc.query(sql2)
		if(res2.rowCount>0) { 
			time2 = (new Date(res2.rows[0].updated)).getTime()
			cryptos = JSON.parse(res2.rows[0].text) 
		}
		const minTime = Math.min(time1,time2)
		data = { 
			updated: minTime, 
			cryptos: cryptos,
			currencies: currencies
		} 
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return data
}

async function saveText(name, value) { 
	const sql    = "UPDATE anydata set text = $2, updated = now()::timestamptz where name = $1"
	const params = [name, value]
	let dbc = null
	let res = null
	let ok  = false
  
  try {
		dbc = await pool.connect()
		res = await dbc.query(sql, params)
		if(res.rowCount>0) { ok = true }
	} catch(ex) {
		console.log('DB error:', ex.message)
	} finally {
  	if (dbc) { dbc.release() }
	}
	
	return ok
}


module.exports = {
	newAccount,
	getAccount,
	getAccountByName,
	checkName,
	saveName,
	getPublicKey,
	getPublicKeyByName,
	getUserByName,
	getUsersByAccount,
	getPrices,
	saveText,
	test
}



// END