/**
 * Abstract Exchange class to implement for each exchange
 */
class Exchange {
  constructor(name, makerFee, takerFee)
  {
    this._name = name
    this._makerFee = makerFee
    this._takerFee = takerFee
    this._requests = 0
    this.tickers = {}
    this.symbolMap // symbolMap = commonSymbol => internalSymbol mapping
    // forcing all exchanges to have a "symbol map" might be a bit weird, not all exchanges pull stupid shit like bitfinex
  }

  /**
   * @returns {String[]} Common representation of all symbols trading on the exchange
   */
  get symbols()
  {
    return this.symbolMap.keys()
  }

  /**
   * @returns {String[]} Internal representation of all the symbols trading on the exchange
   */
  get internalSymbols()
  {
    return this.symbolMap.values()
  }

  /**
   * Set up the mapping between common representation of symbols and internal representation
   */
  async setupSymbolMap()
  {
    throw new Error("setupSymbolMap has to be implemented")
  }

  get makerfee()
  {
    return this._makerFee
  }

  get takerfee()
  {
    return this._takerFee
  }

  get name()
  {
    return this._name
  }

  get requests()
  {
    return this._requests
  }

  async getOrderBook(symbol)
  {
    throw new Error("getOrderBook has to be implemented")
  }

  async getBestBidAsk(symbol)
  {
    throw new Error("getBestBidAsk has to be implemented")
  }

  async getAllTickers()
  {
    throw new Error("getAllTickers has to be implemented")
  }

  /**
   * 
   * @param {string[]} symbols 
   * 
   * @returns {Promise<Object>}
   */
  async getTickers(symbols)
  {
    throw new Error("getTickers has to be implemented")
  }
  /**
   * Update the tickers object of the exchange instance
   */
  async updateTickers()
  {
    throw new Error("updateTickers has to be implemented")
  }

  /**
   * @returns {Map<string,string>} Translation map symbol => internal symbol
   */
  async getCommonSpotSymbolMap()
  {
    throw new Error("getCommonSpotSymbolMap has to be implemented")
  }

  toInternalSymbol(symbol)
  {
    return this.getCommonSpotSymbolMap().get(symbol)
  }

}

module.exports = {Exchange}