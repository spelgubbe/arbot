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
//const { WSv2 } = require('bitfinex-api-node')

//const ws = new WSv2({ transform: true })


//const binance_spot_taker_fee = 0.00075 // 0.075%
//const binance_spot_maker_fee = 0.00040 // 0.040%
//const max_risk = 1000

/**
 * 
 * @param {string} symbol 
 * @param {Map<string>} symbolMapping 
 * @param {string} exchange 
 */
async function getOrderBook(symbol, symbolMapping, exchange)
{
  if (!symbolMapping.has(symbol)) throw new Error("Invalid symbol, not present in symbol map.")
  
  let internalSymbol = symbolMapping[symbol]

  switch (exchange) {
    case "bin":
      return await binbook.getOrderBook(internalSymbol)
    case "bfx":
      return await bfxbook.getOrderBook(internalSymbol, "R0", 5)
    case "cb":
      return await cbbook.getOrderBook(internalSymbol)
    default:
      throw new Error("Invalid exchange identifier, can not fetch orderbook of unknown exchange.")
  }
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
  
  switch (exchange) {
    
    case "bin":
      return await binbook.getOrderBook(symbol)
    case "bfx":
      return await bfxbook.getOrderBook(symbol, "R0", 5)
    case "cb":
      return await cbbook.getOrderBook(symbol)
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

    //console.log("BFX SPOT MAP")
    //bfxSpotMap.forEach((key, val) => console.log(`${key},${val}`))



    //if(bfxSpotMap.has("datusd")) console.log("Hello")
    //if(bfxSpotMap.has("dshusd")) console.log("Hello")

    //if(binSpotMap.has("datausdt")) console.log("Hello")
    //if(binSpotMap.has("dashusdt")) console.log("Hello")

    var binSymbolSet = new Set(binSpotMap.keys())
    var bfxSymbolSet = new Set(bfxSpotMap.keys())
    var cbSymbolSet = new Set(cbSpotMap.keys())

    // might do a pair-wise union algorithm for log n unions
    var symbolUnion = getSymbolSetUnion(binSymbolSet, getSymbolSetUnion(bfxSymbolSet, cbSymbolSet))

  } catch(err)
  {
    console.log(err)
    return
  }

  //let bfx_books = getSymbolSetIntersection(symbolUnion, bfxSymbolSet)
  //let bin_books = getSymbolSetIntersection(symbolUnion, binSymbolSet)
  //let cb_books = getSymbolSetIntersection(symbolUnion, cbSymbolSet)
  
  // Number of pairs to check grows exponentially with number of exchanges added. So this should be automated

  let bin_bfx_isect = getCommonSymbolsList(binSpotMap, bfxSpotMap)
  let bin_cb_isect = getCommonSymbolsList(binSpotMap, cbSpotMap)
  let bfx_cb_isect = getCommonSymbolsList(bfxSpotMap, cbSpotMap)

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

  //bin_bfx_isect.forEach(val => console.log(`${val}`))
  //bin_cb_isect.forEach(val => console.log(`${val}`))
  //bfx_cb_isect.forEach(val => console.log(`${val}`))

  let isects = {
    bin_bfx: {intersection: bin_bfx_isect, exchanges: ["bin", "bfx"], spotMaps: [binSpotMap, bfxSpotMap]},
    bin_cb: {intersection: bin_cb_isect, exchanges: ["bin", "cb"], spotMaps: [binSpotMap, cbSpotMap]},
    bfx_cb: {intersection: bfx_cb_isect, exchanges: ["bfx", "cb"], spotMaps: [bfxSpotMap, cbSpotMap]}
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
        //var e1OrderBook = await getOrderBookBySymbol(symbol1, exchange1)
        //var e2OrderBook = await getOrderBookBySymbol(symbol2, exchange2)

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
      if (profitableTrade[0] === true){
        let buyExchange = val.exchanges[profitableTrade[2].buy]
        let sellExchange = val.exchanges[profitableTrade[2].sell]
        console.log(`${symbol}: buy at ${buyExchange} sell at ${sellExchange}`, profitableTrade)
      } else {
        //console.log(profitableTrade)
      }
    }
  })
    

  // One potential problem is that the bot "pulls the rug" on itself. It might consume orders on an exchange doing arbitrage
  // but simultaneously plan to perform other trades using the consumed orders
  // to handle this, the easiest is probably to have some "reduce"-stage where the trade ideas are merged and
  // some trades can be filtered out if needed

}

findArbs()