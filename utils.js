// UTILITIES

Array.prototype.sortKey = function(key){
  this.sort((a, b)=> {
    if(a[key]<b[key]) return -1
    if(a[key]>b[key]) return 1
    return 0
  })
}

function firstWord(text) {
  if(!text) { return '' }
  let first = ''
  const words = text.trim().toLowerCase().split(/\s+/)
  if(words.length>0) { first = words[0] }
  if(first[0]==='@') { first = '@' }
  if(first[0]==='/') { first = first.substr(1) }
  return first
}

function getTime(date) {
  // If date = today return time else day
  if(!date || (''+date).length<10){ console.log('? GetTime',date); return '00:00' }
  const input = new Date(date)
  const today = new Date()
  const day1  = input.toISOString().substr(0,10) // 2015-11-18T03:47:47Z
  const day2  = today.toISOString().substr(0,10)
  const time1 = input.toTimeString().substr(0,5)
  //var time2 = today.toTimeString().substr(0,5)

  if(day1===day2) { return time1 }
  return day1.substr(5)
}

function isInteger(num) {
  return num % 1 === 0
}

function money(num, dec=2) {
  return (1*num).toFixed(dec)
}

function priceFormat(num) {
  return isInteger(num*10) ? (1*num).toFixed(2) : (1*num).toFixed(6)
}

function toJSON(data){
  // Useful for bigints that error
  const parser = (key, value) => typeof value === "bigint" ? value.toString() : value
  return JSON.stringify(data, parser, 2)
}

function trimFloat(num, maxDecs) {
  let str = ''+Number.parseFloat(num)
  if(str.indexOf('.') < 0) { return str } // Integer
  //if(num % 1 == 0) { return num } // Integer
  str = str.replace(/0+$/, '')      // Trailing zeroes
  if(str.slice(-1)==='.') { str = str.slice(0,-1) } // remove last period
  if(str.length===0) { str = '0' }
  return str
}


function base64tohex(base64str){
  return Buffer.from(base64str, 'base64').toString('hex')
}

function hextobase64(hexstr){
  return Buffer.from(hexstr, 'hex').toString('base64')
}

module.exports = {
  base64tohex,
  firstWord,
  getTime,
  isInteger,
  hextobase64,
  money,
  priceFormat,
  toJSON,
  trimFloat
}
