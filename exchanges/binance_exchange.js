const BinanceAPI = require('node-binance-api')
const binanceAPI = new BinanceAPI()
const {Exchange} = require('./exchange')
class BinanceExchange extends Exchange
{
  async getBestBidAskFromBook(symbol)
  {
    return await new Promise((resolve, reject) =>
    {
      binanceAPI.bookTickers(symbol, (error, askbid) => {
        if (!error)
        {
          resolve(askbid)
        } else {
          reject(error)
        }
      })
    })
  }

  getBestBidAsk(symbol)
  {
    return "NYI"
  }

  async getOrderBook(symbol)
  {
    let depth = await new Promise((resolve, reject) =>
    {
      binanceAPI.depth(symbol, (error, depth, symbol) => {
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

  async getAllTickers()
  {
    // tckr holds internal representation
    let tckr = await binanceAPI.bookTickers()
    // convert
    let obj = {}
    for(const [key,val] of Object.entries(tckr))
    {
      let newEntry = {}
      newEntry.bid = Number(val.bid)
      newEntry.bids = Number(val.bids)
      newEntry.ask = Number(val.ask)
      newEntry.asks = Number(val.asks)
      obj[this.symbolToCommon(key)] = newEntry
    }

    return obj
  }

  async getSpotSymbolList()
  {
    // BULL/BEAR contracts are listed in binanceAPI.prices(), not really a problem
    // except that they cant be arbed probably (so they have to be excluded)
    let tickerObj = await binanceAPI.prices()
    return Object.keys(tickerObj)
  }

  async getCommonSpotSymbolMap()
  {
    let map = new Map()
    let spotSymbols = await this.getSpotSymbolList()
    spotSymbols.forEach(elem => map.set(this.symbolToCommon(elem), elem))
    return map
  }


  symbolsToCommon(binSymbols)
  {
    // convert from eg. BTCUSD to btcusd
    return binSymbols.map(elem => elem.toLowerCase())
  }

  symbolToCommon(symbol)
  {
    // convert from eg. BTCUSD to btcusd
    return symbol.toLowerCase()
  }

  // ABSTRACT METHODS

  async setupSymbolMap()
  {
    this.symbolMap = await this.getCommonSpotSymbolMap()
  }

  async updateTickers()
  {
    // get ticker
    // translate keys
    this.tickers = await this.getAllTickers()
  }
}


async function test()
{
  let exchange = new BinanceExchange("Binance", 0.0075, 0.0075)
  await exchange.setupSymbolMap()
  console.log(await exchange.getAllTickers())
}

test()