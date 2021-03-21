const Binance = require('node-binance-api')
const binance = new Binance().options({
  APIKEY: 'zg80mN8LCZVJ0vaZSaxXvqtaOystoOOBkJPbhqCE82qkfGIXmwDcJdYI5AQf6opL',
  APISECRET: 'a17Fec1O9bdgEJd5KdFfNXaOskh0SAvt36rE5wMHe99g8SQsbQaBC9pUYqC6faBq'
})
// testnet api key, should ofc be in a env file

// future feature...
//const knownDenominators = ["USD", "USDT", "EUR", "EURT", "BTC", "ETH", "BNB"]


async function getBestBidAsk(symbol)
{
  let best = await new Promise((resolve, reject) =>
  {
    binance.bookTickers(symbol, (error, askbid) => {
      if (!error)
      {
        resolve(askbid)
      } else {
        reject(error)
      }
    })
  })
  
  return best
}

async function getOrderBook(ticker)
{
  let depth = await new Promise((resolve, reject) =>
  {
    binance.depth(ticker, (error, depth, symbol) => {
      if (!error)
      {
        resolve(depth)
      } else {
        reject(error)
      }
    })
  })

  let asks = new Array()
  let bids = new Array()

  for(const [price, amount] of Object.entries(depth.asks))
  {
    asks.push({price: Number(price), amount})
  }

  for(const [price, amount] of Object.entries(depth.bids))
  {
    bids.push({price: Number(price), amount})
  }

  // Sort bids so that highest bid is first, bids[0] = highest bid
  // Descending order
  bids.sort((e1,e2) => e2.price - e1.price)
  
  return {asks, bids}
}

async function getSpotTradingPairs()
{
  // BULL/BEAR contracts are listed in binance.prices(), not really a problem
  // except that they cant be arbed probably (so have to be excluded)
  let binance_prices = await binance.prices()
  return Object.keys(binance_prices)
  //console.log(binance_prices)
}

async function getSpotTickers()
{
  // BULL/BEAR contracts are listed in binance.prices(), not really a problem
  // except that they cant be arbed probably (so have to be excluded)
  return await binance.prices()
  //console.log(binance_prices)
}

async function getSpotSymbolList()
{
  // BULL/BEAR contracts are listed in binance.prices(), not really a problem
  // except that they cant be arbed probably (so they have to be excluded)
  let tickerObj = await binance.prices()
  return Object.keys(tickerObj)
}

async function getSpotSymbolMap()
{
  let map = new Map()
  let spotSymbols = await getSpotSymbolList()
  spotSymbols.forEach(elem => map.set(elem, elem))
  return map
}

async function getCommonSpotSymbolMap()
{
  let map = new Map()
  let spotSymbols = await getSpotSymbolList()
  spotSymbols.forEach(elem => map.set(symbolToCommon(elem), elem))
  return map
}


function symbolsToCommon(binSymbols)
{
  // convert from eg. BTCUSD to btcusd
  return binSymbols.map(elem => elem.toLowerCase())
}

function symbolToCommon(symbol)
{
  // convert from eg. BTCUSD to btcusd
  return symbol.toLowerCase()
}

/*
(async() => {
  //let x = await getSpotTradingPairs()
  //let x = await getFuturesPairs()
})()*/

/*
async function test()
{
  //console.log(await getOrderBook("BTCUSDT"))
  //console.log(await getSpotTradingPairs())
  console.log(await binance.prices())
  console.log(await getCommonSpotSymbolMap())
}

test()
*/
module.exports = {getOrderBook, symbolsToCommon, getSpotTradingPairs, getBestBidAsk, getSpotTickers, getSpotSymbolMap, getCommonSpotSymbolMap}