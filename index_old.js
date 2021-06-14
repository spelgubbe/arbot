
const {getCommonKeysList, getSetUnion, getSetIntersection} = require('./utility')
const arb = require('./arb')
const bfxbook = require('./old/bitfinex_books')
const binbook = require('./old/binance_books')
const cbbook = require('./old/coinbase_books')
const polobook = require('./old/poloniex_books')

const exchanges = new Map()
const orderbookCache = new Map()

let numRequests = 0

function setupExchanges()
{
  exchanges.set(bfxbook.identifier, bfxbook)
  exchanges.set(binbook.identifier, binbook)
  exchanges.set(cbbook.identifier, cbbook)
  exchanges.set(polobook.identifier, polobook)
}


/**
 * 
 * @param {string} symbol 
 * @param {string} exchange 
 * 
 * @returns {Object} Object representing an orderbook
 */
async function getOrderBookBySymbol(symbol, exchange)
{
  let idString = `${exchange}:${symbol}`

  if(orderbookCache.has(idString))
  {
    return orderbookCache.get(idString)
  }
  numRequests++
  if (exchanges.has(exchange))
  {
    var book = await exchanges.get(exchange).getOrderBook(symbol)
  }
  else 
  {
    throw new Error("Invalid exchange identifier, can not fetch orderbook of unknown exchange.")
  }
  orderbookCache.set(idString, book)
  return book
}

async function fetchSpotMaps()
{
  try{
    let binSpotMap = await binbook.getCommonSpotSymbolMap()
    let bfxSpotMap = await bfxbook.getCommonSpotSymbolMap()
    let cbSpotMap = await cbbook.getCommonSpotSymbolMap()
    let poloSpotMap = await polobook.getCommonSpotSymbolMap()

    return {
      binSpotMap,
      bfxSpotMap,
      cbSpotMap,
      poloSpotMap
    }

  } catch(err)
  {
    console.log(err)
    return
  }
}

async function fetchOrderbookPair({exchange1, symbol1}, {exchange2, symbol2})
{
  try{
    var [e1OrderBook, e2OrderBook] = await Promise.all([
      getOrderBookBySymbol(symbol1, exchange1),
      getOrderBookBySymbol(symbol2, exchange2)
    ])

    return [e1OrderBook, e2OrderBook]
    
  } catch(err)
  {
    console.log("Fetching order books failed: " + err)
    return
  }
}

async function findArbs()
{

  let {
    binSpotMap,
    bfxSpotMap,
    cbSpotMap,
    poloSpotMap
    } = fetchSpotMaps()
  
  // Number of pairs to check grows exponentially with number of exchanges added. So this should be automated
  let bin_bfx_isect = getCommonKeysList(binSpotMap, bfxSpotMap)
  let bin_cb_isect = getCommonKeysList(binSpotMap, cbSpotMap)
  let bfx_cb_isect = getCommonKeysList(bfxSpotMap, cbSpotMap)

  let polo_bin_isect = getCommonKeysList(poloSpotMap, binSpotMap)
  let polo_cb_isect = getCommonKeysList(poloSpotMap, cbSpotMap)
  let polo_bfx_isect = getCommonKeysList(poloSpotMap, bfxSpotMap)

  // absolute mess
  let isects = {
    bin_bfx: {intersection: bin_bfx_isect, exchanges: [binbook.identifier, bfxbook.identifier], spotMaps: [binSpotMap, bfxSpotMap]},
    bin_cb: {intersection: bin_cb_isect, exchanges: [binbook.identifier, cbbook.identifier], spotMaps: [binSpotMap, cbSpotMap]},
    bfx_cb: {intersection: bfx_cb_isect, exchanges: [bfxbook.identifier, cbbook.identifier], spotMaps: [bfxSpotMap, cbSpotMap]},

    polo_bin: {intersection: polo_bin_isect, exchanges: [polobook.identifier, binbook.identifier], spotMaps: [poloSpotMap, binSpotMap]},
    polo_cb: {intersection: polo_cb_isect, exchanges: [polobook.identifier, cbbook.identifier], spotMaps: [poloSpotMap, cbSpotMap]},
    polo_bfx: {intersection: polo_bfx_isect, exchanges: [polobook.identifier, bfxbook.identifier], spotMaps: [poloSpotMap, bfxSpotMap]}
  }
  
  Object.entries(isects).forEach(async ([key,exchangePair]) => {

    for(const symbol of exchangePair.intersection)
    {
      let [exchange1, exchange2] = exchangePair.exchanges
      let [symbolMap1, symbolMap2] = exchangePair.spotMaps
      
      let symbol1 = symbolMap1.get(symbol)
      let symbol2 = symbolMap2.get(symbol)

      let [e1Orderbook, e2Orderbook] = fetchOrderbookPair({exchange1, symbol1}, {exchange2, symbol2})
      
      let tradeObj = arb.compareBooks(e1Orderbook, e2Orderbook, 0.00075, 0.00075) // assumes bad fees
      let profit = tradeObj[1]

      if (profit > 0.002){
        let profitPct = profit*100
        let profitPctRounded = Math.round((profitPct+Number.EPSILON)*1000)/1000;
        let buyExchange = exchangePair.exchanges[tradeObj[2].buy]
        let sellExchange = exchangePair.exchanges[tradeObj[2].sell]
        console.log(`${profitPctRounded}%\t\t\t\t ${symbol} \t\t Buy ${buyExchange} \t\t Sell ${sellExchange}`)
      }
    }
  })
}

setupExchanges()
findArbs()