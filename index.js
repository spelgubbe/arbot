/*const Binance = require('node-binance-api')
const binance = new Binance().options({
  APIKEY: 'zg80mN8LCZVJ0vaZSaxXvqtaOystoOOBkJPbhqCE82qkfGIXmwDcJdYI5AQf6opL',
  APISECRET: 'a17Fec1O9bdgEJd5KdFfNXaOskh0SAvt36rE5wMHe99g8SQsbQaBC9pUYqC6faBq'
})*/


const arb = require('./arb')
const bfxbook = require('./bitfinex_books')
const binbook = require('./binance_books')
//const { WSv2 } = require('bitfinex-api-node')

//const ws = new WSv2({ transform: true })


//const binance_spot_taker_fee = 0.00075 // 0.075%
//const binance_spot_maker_fee = 0.00040 // 0.040%
//const max_risk = 1000

async function test()
{
  //let binance_prices = await binance.futuresPrices();
  //let binance_pairs = Object.keys(binance_prices);
  try{
    var binSpotMap = await binbook.getCommonSpotSymbolMap()
    var bfxSpotMap = await bfxbook.getCommonSpotSymbolMap()
  } catch(err)
  {
    console.log(err)
    return
  }
  

  //console.log("BINANCE SPOT MAP:")
  //console.log(binSpotMap)

  //console.log("BITFINEX SPOT MAP:")
  //console.log(bfxSpotMap)

  let symbolUnion = arb.getCommonSymbols(binSpotMap, bfxSpotMap)

  console.log(symbolUnion)

  let anyProfitable = false;
  /*
  for(var i = 0; i < symbolUnion.length; i++)
  {
    let symbol = symbolUnion[i]
    
  }*/
  // this should run in an async function for speed ofc
  
  symbolUnion.forEach(async (symbol) => {
    let binSymbol = binSpotMap.get(symbol)
    let bfxSymbol = bfxSpotMap.get(symbol)
    //console.log(bfxSymbol)
    //console.log(binSymbol)
    
    try{
      var bfxOrderBook = await bfxbook.getOrderBook(bfxSymbol, "R0", 5)
      var binOrderBook = await binbook.getOrderBook(binSymbol)
  } catch(err)
  {
    console.log("Fetching order books failed: " + err)
    return
  }

    

    let exchanges = ["bitfinex", "binance"]

    let profitableTrade = arb.compareBooks(bfxOrderBook, binOrderBook, 0.00075, 0.00075)
    if (profitableTrade[0] === true){
      anyProfitable = true
      let buyExchange = exchanges[profitableTrade[2].buy]
      let sellExchange = exchanges[profitableTrade[2].sell]
      console.log(`${symbol}: buy at ${buyExchange} sell at ${sellExchange}`, profitableTrade)

    }
  })
  console.log(`any profitable? ${anyProfitable}`)
}

test()