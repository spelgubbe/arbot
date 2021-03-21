/*const Binance = require('node-binance-api')
const binance = new Binance().options({
  APIKEY: 'zg80mN8LCZVJ0vaZSaxXvqtaOystoOOBkJPbhqCE82qkfGIXmwDcJdYI5AQf6opL',
  APISECRET: 'a17Fec1O9bdgEJd5KdFfNXaOskh0SAvt36rE5wMHe99g8SQsbQaBC9pUYqC6faBq'
})*/

const {getCommonSymbolsList, getSymbolSetUnion, getSymbolSetIntersection} = require('./utility')
const arb = require('./arb')
const bfxbook = require('./bitfinex_books')
const binbook = require('./binance_books')
const cbbook = require('./coinbase_books')
const polobook = require('./poloniex_books')
//const { WSv2 } = require('bitfinex-api-node')

const orderbookCache = new Map()

const tickerCache = new Map()

let numRequests = 0

//const ws = new WSv2({ transform: true })


//const binance_spot_taker_fee = 0.00075 // 0.075%
//const binance_spot_maker_fee = 0.00040 // 0.040%
//const max_risk = 1000

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
  var book
  switch (exchange) {
    
    case "bin":
      book = await binbook.getOrderBook(symbol)
      break
    case "bfx":
      book = await bfxbook.getOrderBook(symbol, "R0", 5)
      break
    case "cb":
      book = await cbbook.getOrderBook(symbol)
      break
    case "polo":
      book = await polobook.getOrderBook(symbol)
      break
    default:
      throw new Error("Invalid exchange identifier, can not fetch orderbook of unknown exchange.")
  }
  orderbookCache.set(idString, book)
  return book
}

async function getTickerBySymbol(symbol, exchange)
{
  
  switch (exchange) {
    
    case "bin":
      return await binbook.getBestBidAsk(symbol)
    case "bfx":
      return await bfxbook.getBestBidAsk(symbol)
    case "cb":
      return await cbbook.getBestBidAsk(symbol)
    case "polo":
      return await polobook.getBestBidAsk(symbol)
    default:
      throw new Error("Invalid exchange identifier, can not fetch orderbook of unknown exchange.")
  }
}

async function findArbs()
{
  //let binance_prices = await binance.futuresPrices();
  //let binance_pairs = Object.keys(binance_prices);
  try{
    var binSpotMap = await binbook.getCommonSpotSymbolMap()
    var bfxSpotMap = await bfxbook.getCommonSpotSymbolMap()
    var cbSpotMap = await cbbook.getCommonSpotSymbolMap()
    var poloSpotMap = await polobook.getCommonSpotSymbolMap()

    var binSymbolSet = new Set(binSpotMap.keys())
    var bfxSymbolSet = new Set(bfxSpotMap.keys())
    var cbSymbolSet = new Set(cbSpotMap.keys())
    var poloSymbolSet = new Set(poloSpotMap.keys())

    // might do a pair-wise union algorithm for log n unions
    var symbolUnion = getSymbolSetUnion(binSymbolSet, getSymbolSetUnion(bfxSymbolSet, getSymbolSetUnion(cbSymbolSet, poloSymbolSet)))

  } catch(err)
  {
    console.log(err)
    return
  }

  //let bfx_books = getSymbolSetIntersection(symbolUnion, bfxSymbolSet)
  //let bin_books = getSymbolSetIntersection(symbolUnion, binSymbolSet)
  //let cb_books = getSymbolSetIntersection(symbolUnion, cbSymbolSet)
  
  // Number of pairs to check grows exponentially with number of exchanges added. So this should be automated
  // should rather work on a set than on the spotmaps...
  let bin_bfx_isect = getCommonSymbolsList(binSpotMap, bfxSpotMap)
  let bin_cb_isect = getCommonSymbolsList(binSpotMap, cbSpotMap)
  let bfx_cb_isect = getCommonSymbolsList(bfxSpotMap, cbSpotMap)

  let polo_bin_isect = getCommonSymbolsList(poloSpotMap, binSpotMap)
  let polo_cb_isect = getCommonSymbolsList(poloSpotMap, cbSpotMap)
  let polo_bfx_isect = getCommonSymbolsList(poloSpotMap, bfxSpotMap)

  /*
  Before correcting bfx symbols:
  42 - bin_bfx intersection
  56 - bin_cb intersection
  42 - bfx_cb intersection

  After correcting bfx symbols:
  75 - bin_bfx intersection: 33 pairs more on bfx_bin
  56 - bin_cb intersection: no diff in bin_cb as expected
  47 - bfx_cb intersection: 5 pairs more on bfx_cb
  */
  console.log("lengths:")
  console.log(bin_bfx_isect.length)
  console.log(bin_cb_isect.length)
  console.log(bfx_cb_isect.length)


  let isects = {
    bin_bfx: {intersection: bin_bfx_isect, exchanges: ["bin", "bfx"], spotMaps: [binSpotMap, bfxSpotMap]},
    bin_cb: {intersection: bin_cb_isect, exchanges: ["bin", "cb"], spotMaps: [binSpotMap, cbSpotMap]},
    bfx_cb: {intersection: bfx_cb_isect, exchanges: ["bfx", "cb"], spotMaps: [bfxSpotMap, cbSpotMap]},

    polo_bin: {intersection: polo_bin_isect, exchanges: ["polo", "bin"], spotMaps: [poloSpotMap, binSpotMap]},
    polo_cb: {intersection: polo_cb_isect, exchanges: ["polo", "cb"], spotMaps: [poloSpotMap, cbSpotMap]},
    polo_bfx: {intersection: polo_bfx_isect, exchanges: ["polo", "bfx"], spotMaps: [poloSpotMap, bfxSpotMap]}
  }
  //let bfx_books = arb.getSymbolSetUnion()

  // TODO: Add possibility to investigate into "fair price", for example illiquid eur/gbp/aud pairs, checking them vs forex markets

  // the rest of the code needs caching before this should be run, or too many requests will be sent

  // Fetching the same orderbooks multiple times can happen as more exchanges are added
  //

  // To make the bot go faster there has to be a broad market scan using tickers first
  // Bitfinex ticker shows current highest bid and lowest ask, this can be used to filter through markets
  // and then choose to only look at the books which are interesting

  // since orderbook and ticker has 90 ratelimit / min..
  

  Object.entries(isects).forEach(async ([key,val]) => {

    for(const symbol of val.intersection)
    {
      let symbolMapping1 = val.spotMaps[0]
      let symbolMapping2 = val.spotMaps[1]

      let symbol1 = symbolMapping1.get(symbol)
      let symbol2 = symbolMapping2.get(symbol)

      let exchange1 = val.exchanges[0]
      let exchange2 = val.exchanges[1]

      try{

        var [e1OrderBook, e2OrderBook] = await Promise.all([
          getOrderBookBySymbol(symbol1, exchange1),
          getOrderBookBySymbol(symbol2, exchange2)
        ])
        
      } catch(err)
      {
        console.log("Fetching order books failed: " + err)
        return
      }
      

      let profitableTrade = arb.compareBooks(e1OrderBook, e2OrderBook, 0.00075, 0.00075)
      if (profitableTrade[0] === true && profitableTrade[1] > 0.002){
        let profitPct = profitableTrade[1]*100
        let profitPctRounded = Math.round((profitPct+Number.EPSILON)*1000)/1000;
        let buyExchange = val.exchanges[profitableTrade[2].buy]
        let sellExchange = val.exchanges[profitableTrade[2].sell]
        console.log(`${profitPctRounded}%\t\t\t\t ${symbol} \t\t Buy ${buyExchange} \t\t Sell ${sellExchange}`)
      } else {
        //console.log(profitableTrade)
      }
    }
    //console.log(`Number of requests: ${numRequests}`)
  })
    

  // One potential problem is that the bot "pulls the rug" on itself. It might consume orders on an exchange doing arbitrage
  // but simultaneously plan to perform other trades using the consumed orders
  // to handle this, the easiest is probably to have some "reduce"-stage where the trade ideas are merged and
  // some trades can be filtered out if needed

}

findArbs()