const fetch = require('node-fetch') 
const url = 'https://api-pub.bitfinex.com/v2/'

const identifier = "Bitfinex"

const symbolMapPath = "conf/pub:map:currency:sym"
const currencyPath = "conf/pub:list:currency"

const customCurrencyMapping = {"REP2": "REP"}

async function getTranslationList()
{
  const res = await request(symbolMapPath)
  return res[0]
}

async function getTranslationMap()
{
  // A map to translate an internal representation of a currency to a common representation of a currency
  // eg. UST => USDT
  // eg. DSH => DASH
  let map = new Map()
  let translationTable = await getTranslationList()
  for(let [internal, common] of translationTable)
  {
    if (common in customCurrencyMapping)
    {
      common = customCurrencyMapping[common] // eg. REP2 => REP
    }
    map.set(internal, common)
  }
  return map
}

async function getCurrencyList()
{
  const res = await request(currencyPath)
  return res[0]

}

async function request(path, params) {
    try {
        let reqString = `${url}/${path}`
        if (params != null)
        {
          reqString += `?${params}`
        }
        const req = await fetch(reqString)
        const response = await req.json()
        //console.log(`STATUS ${req.status} - ${JSON.stringify(response)}`)
        if (response.hasOwnProperty("error"))
        {
          throw new Error("Bitfinex: ERR_RATE_LIMIT")
        }
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
  
  // Sort bids in descending order, so that bids[0] = highest bid
  bids.sort((e1,e2) => e2.price - e1.price)
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
    throw new Error(`Request for ${path} with params = ${params} failed. ${err}`)
  }
  
  return toReadableBook(bookArray, rawBook)
}

/**
 * Get all symbols on Bitfinex API.
 * @returns {Array<String>} Array of symbols (strings)
 */
async function getSymbolNames()
{
  let tickers = await getAllTickers()
  let symbolArr = tickers.map(elem => elem[0])
  return symbolArr
}

/**
 * 
 * @returns {Array<Object>}
 */
async function getAllTickers()
{

  /*
  Ticker element for BTCUSD (trading pair)

  0	"tBTCUSD"           SYMBOL
  1	57319               BID
  2	7.60976982          BID_SIZE
  3	57334               ASK
  4	26.951948599999998  ASK_SIZE
  5	-705                DAILY_CHANGE
  6	-0.0121             DAILY_CHANGE_RELATIVE
  7	57320               LAST_PRICE
  8	8612.7437958        VOLUME
  9	60190               HIGH
  10 57255              LOW

  */

  const pathParams = 'tickers'
  const queryParams = 'symbols=ALL'
  let tickerArr = await request(pathParams, queryParams)
  return tickerArr
}

/**
 * Get the highest bid and the lowest ask from a Bitfinex ticker
 * @param {Array<Object>} ticker 
 * @returns {Array<Number>} Array of best [bid, ask]
 */
function getBidAndAsk(ticker)
{
  const bid = ticker[1]
  const ask = ticker[3]
  return {bid, ask}
}

/**
 * 
 * @param {Array<Object>} tickers 
 * @returns {Array<Object>}
 */
async function getBestBidsAndAsks(tickers)
{
  const t = await getAllTickers()
  return t.map(elem => [elem[0], getBidAndAsk(elem)])
}

/**
 * Untested
 * @param {Array<string>} symbols 
 * @returns {Array<Object>} tickers
 */
async function getTickers(symbols)
{
  const pathParams = 'tickers'
  let queryParams = 'symbols='
  const commaSeparatedTickerString = symbols.join(',')
  queryParams += commaSeparatedTickerString
  console.log(queryParams)
  let tickerArr = await request(pathParams, queryParams)

  return tickerArr
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
  let translationTable = await getTranslationList()
  symbols.forEach(elem => map.set(symbolToCommon(elem, translationTable), elem))
  return map
}

async function getSpotSymbolMap()
{
  return await getSymbolMap().filter(
    elem[0] == 't' && elem.indexOf(':') == -1
  )
}

async function translatePairs(pairList)
{
  let translationMap = await getTranslationMap()

  return Arrays.map(pairList, pair => translatePair(pair, translationMap))
}

function translatePair(pair, translationMap)
{
  let n = pair[0]
  let d = pair[1]
  if (translationMap.has(n))
  {
    n = translationMap.get(n)
    //console.log(`${pair[0]} => ${n}`)
  }

  if (translationMap.has(d))
  {
    d = translationMap.get(d)
    //console.log(`${pair[1]} => ${d}`)
  }
  return [n,d]
}

// This function corrects bitfinex internal representation of cryptos to the general representations
async function getCommonSpotSymbolMap()
{
  let map = new Map()
  let symbols = await getSpotTradingPairs()
  let currencyList = await getCurrencyList()  
  let translationMap = await getTranslationMap()

  for(var symbol of symbols)
  {
    let currencyPair = parseCurrency(symbol.substring(1), currencyList)
    let translatedPair = translatePair(currencyPair, translationMap)
    let commonSymbol = translatedPair[0] + translatedPair[1]
    
    map.set(commonSymbol.toLowerCase(), symbol)
  }

  return map
}

async function getCommonSpotSymbolMap2()
{
  let map = new Map()
  let symbols = await getSpotTradingPairs()
  symbols.forEach(elem => map.set(symbolToCommonOld(elem), elem))
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

function symbolToCommonOld(bfxSymbol)
{
  return bfxSymbol.substring(1).toLowerCase()
}

function parseCurrency(str, currencyList)
{
  // currencyList : list of currencies, eg. BTC, EUR, ETH
  // O(n) where n = currencyList.length
  let nominator, denominator;
  let idx = 0;
  // find first match
  for(let symbol of currencyList)
  {
    if (str.search(symbol) == 0)
    {
      idx = symbol.length
      nominator = symbol
      break
    }
  }

  let restStr = str.substring(idx)
  // find first match
  for(var symbol of currencyList)
  {
    if (symbol.length == restStr.length && restStr.endsWith(symbol))
    {
      denominator = symbol
      break
    }
  }
  return [nominator, denominator]
}


/*
(async() => {
  console.log(await getTranslationList())
 
})()
*/
module.exports = {identifier, getOrderBook, getSymbolNames, getSpotTradingPairs, getFuturesPairs, symbolsToCommon, getSpotSymbolMap, getCommonSpotSymbolMap}