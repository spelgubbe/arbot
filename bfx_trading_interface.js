// Compare two books
// Check if volume is sufficient
// Make a trade

const env = require('dotenv').config()

// BFX

const CryptoJS = require('crypto-js') // Standard JavaScript cryptography library
const fetch = require('node-fetch') // "Fetch" HTTP req library

if(env.error) return
const apiKey = env.parsed.PUBLICKEY
const apiSecret = env.parsed.SECRETKEY
const affiliateCode = env.parsed.AFFLIATECODE

const apiPath = 'v2/auth/r/wallets'// Example path



function makeHeader(path, requestBody)
{
    const nonce = (Date.now() * 1000).toString()
    const signature = `/api/${path}${nonce}${JSON.stringify(requestBody)}`
    const cryptoSig = CryptoJS.HmacSHA384(signature, apiSecret).toString()

    let header = {
    'Content-Type': 'application/json',
    'bfx-nonce': nonce,
    'bfx-apikey': apiKey,
    'bfx-signature': cryptoSig
    }

    return header
}

async function makeLimitTrade(symbol, price, amount)
{

  const apiPath = "v2/auth/w/order/submit"

  const body = {
    type: 'LIMIT',
    symbol: symbol,
    price: String(price),
    amount: String(amount),
    flags: 0, // optional param to add flags
    meta: {aff_code: ""} // optional param to pass an affiliate code
  } 

  fetch(`https://api.bitfinex.com/${apiPath}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: makeHeader()
  })
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => {
      console.log(err)
  })
}

async function getOrders()
{
  const apiPath = "v2/auth/r/orders"
  const body = {}
  fetch(`https://api.bitfinex.com/${apiPath}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: makeHeader(apiPath, body)
  })
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => {
      console.log(err)
  })
}
