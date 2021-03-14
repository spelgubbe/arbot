const fetch = require('node-fetch') 
const url = 'https://api-pub.bitfinex.com/v2/'
// using public api

async function request(path, params) {
    try {
        const reqString = `${url}/${path}?${params}`
        const req = await fetch(reqString)
        const response = await req.json()
        //console.log(`STATUS ${req.status} - ${JSON.stringify(response)}`)
        return response;
    }
    catch (err) {
        throw new Error(`Failed request for ${reqString}`)
    }
}

/**
 * Convert orders array to separate arrays for bids and asks. Each entry holds just price and amount.
 * Bids and asks are ordered in different ways. Last bid element is the highest bid and first ask is the lowest ask.
 * @param {array} bookArray 
 * @param {true if raw orders are in bookArray, if aggregated orders it should be false} rawBook
 * 
 * @returns Object with two arrays. One for bids one for asks. {bids: [ {price, amount}, ... ], asks: [ {price, amount}, ... ]}
 */
function toReadableBook(bookArray, rawBook = false)
{
  // Divide orderbook into bids and asks
  // Convert arrays to objects with keys (probably sucks memory wise)
  // Bitfinex represents the order book using an array of arrays
  // Each array contains numbers representing the order or aggregate of orders
  // Sells are represented by negative "amount"-numbers (bookArray[i][2] < 0 => a sell order)
  let bids = new Array();
  let asks = new Array();
  // Index of price/amount depends on Bitfinex API spec
  let priceIdx = rawBook ? 1 : 0;
  let amountIdx = 2;

  bookArray.forEach(element => {
    const price = element[priceIdx]
    const amount = element[amountIdx]
    
    if (amount >= 0)
    {
      const bookEntry = {price, amount}
      bids.push(bookEntry)
    } else {
      // Bitfinex book represents sells by negative numbers, so they need to be negated
      const bookEntry = {price: price, amount: -amount} 
      asks.push(bookEntry)
    }
  });

  return {bids, asks};
  }
  

/**
* Get an order book for a ticker in the form of a list of bids and a list of asks.
* @param {string} ticker The symbol you want information about (e.g. BTCUSD, ETHUSD)
* @param {string} precision Level of price aggregation (P0, P1, P2, P3, P4, R0)
* @param {Number} count Number of price points
* 
* @returns { bids: [ {price, amount}, ... ], asks: [ {price, amount}, ... ] }
*/
async function getOrderBook(ticker, precision, count)
{
  let rawBook = precision == "R0"
  let path = `book/${ticker}/${precision}`
  let params = count
  try {
    var bookArray = await request(path, params)
  } catch (err)
  {
    return new Error(`Request for ${path} with params = ${params} failed. ${err}`)
  }
  
  const book = toReadableBook(bookArray, rawBook)

  /*console.log("Bids coming here:")
  console.log(book.bids)

  console.log("Asks coming here")
  console.log(book.asks)*/

  return book

}

/**
 * Get all symbols on Bitfinex API.
 * @returns {Array<String>} Array of symbols (strings)
 */
async function getSymbolNames()
{
  const pathParams = 'tickers'
  const queryParams = 'symbols=ALL'
  let tickerArr = await request(pathParams, queryParams)

  let symbolArr = tickerArr.map(elem => elem[0])
  
  return symbolArr
}

async function getCommonSymbolNames()
{
  return await getSymbolNames().map(symbolToCommon)
}

async function getSymbolMap()
{
  let map = new Map()
  let symbols = await getSymbolNames()
  symbols.forEach(elem => map.set(elem, 1))
  return map
}

async function getCommonSymbolMap()
{
  let map = new Map()
  let symbols = await getSymbolNames()
  symbols.forEach(elem => map.set(symbolToCommon(elem), elem))
  return map
}

async function getSpotSymbolMap()
{
  return await getSymbolMap().filter(
    elem[0] == 't' && elem.indexOf(':') == -1
  )
}

async function getCommonSpotSymbolMap()
{
  let map = new Map()
  let symbols = await getSpotTradingPairs()
  symbols.forEach(elem => map.set(symbolToCommon(elem), elem))
  return map
}

async function getSpotTradingPairs()
{
  let allSymbols = await getSymbolNames()
  let tradingPairs = allSymbols.filter(elem => {
    // filter out all funding pairs and futures
    return elem[0] == 't' && elem.indexOf(':') == -1
  })
  return tradingPairs
}

async function getFuturesPairs()
{
  let allSymbols = await getSymbolNames()
  let futuresPairs = allSymbols.filter(elem => {
    // filter out all funding pairs and futures
    return elem[0] == 't' && elem.indexOf(':') != -1
  })
  return futuresPairs
}

// untested but should probably exist
function symbolsToCommon(bfxSymbols)
{
  // convert from eg. tBTCUSD to btcusd
  return bfxSymbols.map(elem => elem.substring(1).toLowerCase())
}

function symbolToCommon(bfxSymbol)
{
  return bfxSymbol.substring(1).toLowerCase()
}

/*

(async() => {
  let x = await getSpotTradingPairs()
  //let x = await getFuturesPairs()
  //let x = await getSymbolNames()
  for(var i = 0; i < x.length; i++)
  {
    console.log(x[i])
  }

})()
*/
module.exports = {getOrderBook, getSymbolNames, getSpotTradingPairs, getFuturesPairs, symbolsToCommon, getSpotSymbolMap, getCommonSpotSymbolMap}