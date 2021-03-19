const fetch = require('node-fetch')

const url = "https://poloniex.com/"


async function request(path, params) {
    try {
        let reqString = `${url}/${path}`
        if (params != null)
        {
          reqString += `?${params}`
        }
        const req = await fetch(reqString)
        const response = await req.json()
        return response;
    }
    catch (err) {
        throw new Error(`Failed request for ${reqString}`)
    }
}

/**
 * Get supported currencies on Poloniex
 * @returns {Object} Object with a key for each supported currency (and some info)
 */
async function getSupportedCurrencies()
{
  const path = 'public'
  const queryParams = 'command=returnCurrencies'
  let currenciesObj = await request(path, queryParams)

  return currenciesObj
}

/**
 * 
 * @param {String} symbol Poloniex trading symbol. Eg. USDT_BTC
 * @returns {Object} Object with keys 'bids', 'asks'
 */
async function getOrderBook(symbol, depth = 50) // depth=50 is default for Poloniex
{
  // https://poloniex.com/public?command=returnOrderBook&currencyPair=BTC_ETH&depth=10
  // Orderbooks:
  // Bids sorted highest to lowest
  // Asks sorted lowest to highest
  const path = 'public'
  let queryParams = 'command=returnOrderBook'
  queryParams += `&currencyPair=${symbol}&depth=${depth}`
  let bookObj = await request(path, queryParams)
  let asks = new Array()
  let bids = new Array()

  bookObj.asks.forEach(priceAmountPair => {
    asks.push({price: Number(priceAmountPair[0]), amount: priceAmountPair[1]})
  })
  bookObj.bids.forEach(priceAmountPair => {
    bids.push({price: Number(priceAmountPair[0]), amount: priceAmountPair[1]})
    //console.log(priceAmountPair[0])
    //console.log(Number(priceAmountPair[0]))
  })

  const book = {asks, bids}
  //console.log(book)

  return book
}

/**
 * 
 * @param {String} symbol
 * 
 * @returns {String} Common symbol
 */
function symbolToCommon(symbol)
{
  // Eg. USD_BTC => BTCUSD
  let underscorePos = symbol.search('_')
  if (underscorePos == -1)
  {
    throw new Error(`Failed parsing Poloniex symbol (${symbol})`)
  }
  const denominator = symbol.substring(0, underscorePos)
  // Eg. USD_BTC => nominator is BTC
  const nominator = symbol.substring(underscorePos+1)

  return nominator+denominator
  
}
/**
 * 
 * @returns {Object} tickersObject
 * 
 */
async function getAllTickers()
{

  /*

  ...
  {
    BTC_BCN:
      { id: 7,
      last: '0.00000024',
      lowestAsk: '0.00000025',
      highestBid: '0.00000024',
      percentChange: '0.04347826',
      baseVolume: '58.19056621',
      quoteVolume: '245399098.35236773',
      isFrozen: '0',
      high24hr: '0.00000025',
      low24hr: '0.00000022' },
    USDC_BTC:
      { id: 224,
      last: '6437.65329245',
      lowestAsk: '6436.73575054',
      highestBid: '6425.68259132',
      percentChange: '0.00744080',
      baseVolume: '1193053.18913982',
      quoteVolume: '185.43611063',
      isFrozen: '0',
      high24hr: '6499.09114231',
      low24hr: '6370.00000000' },
    ...
  }

  */
  const path = 'public'
  const queryParams = 'command=returnTicker'
  let tickerObj = await request(path, queryParams)
  //console.log(tickerObj)

  return tickerObj

}

/**
 * Get the highest bid and the lowest ask from a Bitfinex ticker
 * @param {Array<Object>} ticker 
 * @returns {Object} Object with props for highest bid and lowest ask
 */
function getBidAndAsk(ticker)
{
  /*
    lowestAsk: '6436.73575054',
    highestBid: '6425.68259132',
  */
  const ask = Number(ticker["lowestAsk"])
  const bid = Number(ticker["highestBid"])
  return {bid, ask}
}

/**
 * 
 * @returns {Map<String, Object>} Map of symbol => {bid, ask}
 */
async function getBestBidsAndAsks()
{
  const tickers = await getAllTickers()
  // tickers map holds mappings symbol => ticker
  const map = new Map()
  return tickers.forEach((key,val) => {
    map.set(key, getBidAndAsk(val))
  })
}

/**
 * Get all symbols on Poloniex
 * @returns {Map<String>}
 */
async function getSymbolNames()
{
  const tickers = await getAllTickers()
  return Object.keys(tickers) // tickers is an Object
}

/**
 * Get spot trading pairs on Poloniex (Does not yet filter out non-spot)
 * @returns {string[]} Array of symbols
 */
async function getSpotTradingPairs()
{
  let allSymbols = await getSymbolNames()
  return allSymbols
}

async function getCommonSpotSymbolMap()
{
  let map = new Map()
  let symbols = await getSpotTradingPairs()
  symbols.forEach(elem => map.set(symbolToCommon(elem), elem))
  return map
}

async function test()
{
  let symbols = await getSymbolNames()
  //symbols.forEach(val => console.log(val))
  //console.log(await getOrderBook("USDT_BTC", 50))
  //let supported = await getSupportedCurrencies()
  //Object.keys(supported).forEach(val=>console.log(val))
}

test()

// TODO: filter out BULL/BEAR contracts

//module.exports = {getOrderBook, symbolsToCommon, getSpotTradingPairs, getBestBidAsk, getSpotTickers, getSpotSymbolMap, getCommonSpotSymbolMap}
module.exports = {getOrderBook, getSymbolNames, getSpotTradingPairs, getCommonSpotSymbolMap}