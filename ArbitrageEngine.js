const {getCommonKeysList, getSetUnion, getSetIntersection, getAllPairs} = require('./utility')
const {BitfinexExchange} = require('./exchanges/bitfinex_exchange')
const {BinanceExchange} = require('./exchanges/binance_exchange')

const arb = require('./arb')
class ArbitrageEngine
{
  constructor()
  {
    this.exchanges = [
      new BitfinexExchange(0.0075, 0.0075),
      new BinanceExchange(0.0075, 0.0075)
    ]

    this.exchangeTickers = new Map()

    this.tradeIdeas = []
  }

  async setup()
  {
    //let setupMap = this.exchanges.map(e => e.setupSymbolMap())
    //await Promise.all(setupMap)

    await Promise.all([this.exchanges[0].setupSymbolMap(), this.exchanges[1].setupSymbolMap()])

    this.exchangePairs = getAllPairs(this.exchanges)
    // TODO: associate each pair with intersection in symbols traded
    console.log(this.exchangePairs)
    this.exchangeSymbolIntersections = this.getPairSymbolIntersection(this.exchangePairs)
    console.log(this.exchangeSymbolIntersections)
    await this.updateExchangeTickers() // make this.exchangeTickers not null
    
  }
  
  /**
   * 
   * @param {Array<Exchange>} pairsArr Exchange pairs
   */
  getPairSymbolIntersection(pairsArr)
  {
    return pairsArr.map(([ex1, ex2]) => {
      return [[ex1, ex2], getSetIntersection(new Set(ex1.symbols), new Set(ex2.symbols))]
    })
  }

  // TODO: don't do this pairwise
  /**
   * 
   * @param {Array<String>} symbols 
   * @param {Exchange} exchange1 
   * @param {Exchange} exchange2 
   * @returns {Array<Object>} Array with details about each profitable trade
   */
  getProfitableTrades(symbols, exchange1, exchange2)
  {
    let profitableTrades = []
    for(let symbol of symbols)
    {
      const e1Ticker = this.exchangeTickers.get(symbol).get(exchange1) // NYI
      const e2Ticker = this.exchangeTickers.get(symbol).get(exchange2)
      const e1Fee = exchange1.takerfee
      const e2Fee = exchange2.takerfee

      // eNTicker : {asks: Array<{price: Number, amount: Number}>, bids: Array<{price: Number, amount: Number}>}
      const profitPair = arb.calcTradeProfit(e1Ticker, e2Ticker, e1Fee, e2Fee)

      if (profitPair[0] > 0 || profitPair[1] > 0)
      {
        const trade = {exchange1, exchange2, symbol, profitPair}
        profitableTrades.push(trade)
      }
    }

    return profitableTrades
  }

  findTradeIdeas()
  {
    for(let [[exchange1, exchange2], symbolsIntersection] of this.exchangeSymbolIntersections)
    {
      // exchangeSymbolIntersection : [[Exchange,Exchange], Set<String>]

      let profitableTrades = this.getProfitableTrades(symbolsIntersection, exchange1, exchange2)
      this.tradeIdeas.push(...profitableTrades)
    }
  }

  ideaToString({symbol, profit, buyExchange, sellExchange})
  {
    return `${symbol}:${profit}\tBuy ${buyExchange.identifier}\tSell ${sellExchange.identifier}`
  }

  tick()
  {
    this.loadExchangeTickers() // here
    this.findTradeIdeas()

    this.tradeIdeas.map(idea => console.log(this.ideaToString(idea)))

    this.resetTradeIdeas()
    this.resetExchangeTickers()
  }

  loadExchangeTickers()
  {
    for(let exchange of this.exchanges)
    {

      this.exchangeTickers.set(exchange, exchange.getTickersCopy())
      //console.log(this.exchangeTickers.get(exchange))
    }
  }

  resetExchangeTickers()
  {
    this.exchangeTickers.clear()
  }

  resetTradeIdeas()
  {
    this.tradeIdeas = []
  }

  async updateExchangeTickers()
  {
    for(let exchange of this.exchanges)
    {
      await exchange.updateTickers()
      console.log(exchange.tickers.btcusd)
    }
  }
}

module.exports = {ArbitrageEngine}