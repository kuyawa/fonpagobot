const crypto = require('node:crypto')
const algo = process.env.CIPHERALGO
const pass = process.env.CIPHERPHRASE
const salt = process.env.CIPHERQUOTE

function encrypt(text){
	const key = crypto.scryptSync(pass, salt, 24) // Use the async `crypto.scrypt()` instead
	// Use `crypto.randomBytes` to generate a random iv instead of the static iv shown here
	const iv = Buffer.alloc(16, 0) // Initialization vector
	const cipher = crypto.createCipheriv(algo, key, iv)
	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')
	//console.log(encrypted)
	return encrypted
}

function decrypt(text){
	// Use the async `crypto.scrypt()` instead
	const key = crypto.scryptSync(pass, salt, 24)
	// The IV is usually passed along with the ciphertext
	const iv = Buffer.alloc(16, 0) // Initialization vector
	const decipher = crypto.createDecipheriv(algo, key, iv)
	// Encrypted using same algorithm, key and iv
	let decrypted = decipher.update(text, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	//console.log(decrypted)
	return decrypted
}

module.exports = {
	encrypt,
	decrypt
}

// END