/*
npm install coinbase-pro-node

Status Code 	Reason
400 	Bad Request -- Invalid request format
401 	Unauthorized -- Invalid API Key
403 	Forbidden -- You do not have access to the requested resource
404 	Not Found
500 	Internal Server Error -- We had a problem with our server

Coinbase Pro API

Keep in mind:

*Some endpoints don't require authentication

"By default, each API key or app is rate limited at 10,000 requests
 per hour. If your requests are being rate limited, 
 HTTP response code 429 will be returned with an rate_limit_exceeded error."

 */

 //Goal is to implement all of these
 // module.exports = {getOrderBook, symbolsToCommon, getSpotTradingPairs, getBestBidAsk, getSpotTickers, getSpotSymbolMap, getCommonSpotSymbolMap}

const {CoinbasePro, OrderBookLevel} = require('coinbase-pro-node');
const client = new CoinbasePro();

const endpoint = "https://api.pro.coinbase.com"
// target = /products

// view only api secret = YGhmiSjiz4qGTifkUzwKEGUPwy6cz4HCI+fq6vikYRfU44BJngQ7i5ztRiv5K4ePP3PHRhOMpi29NSECZdmmQg==
// view only api public = 23050e9f51a8c3683e087cb52187aa08

async function getProductSymbols()
{
  /* client.rest.product.getProducts() returns an array: Example of one element, 
    id: 'BCH-EUR',
    base_currency: 'BCH',
    quote_currency: 'EUR',
    base_min_size: '0.01000000',
    base_max_size: '100.00000000',
    quote_increment: '0.01000000',
    base_increment: '0.00000001',
    display_name: 'BCH/EUR',
    min_market_funds: '10',
    max_market_funds: '300000',
    margin_enabled: false,
    post_only: false,
    limit_only: false,
    cancel_only: false,
    trading_disabled: false,
    status: 'online',
    status_message: ''
  */

  let productInfo = await client.rest.product.getProducts()
  let symbols = new Array()
  productInfo.forEach(product => {
    if (!product.trading_disabled && product.status == 'online')
    {
      symbols.push(product.id)
    }
  })
  return symbols
}

/**
 * @returns {Map<String,String>} Map of common ticker name => coinbase pro product id
 */
async function getCommonSpotSymbolMap()
{
  let map = new Map()
  let spotSymbols = await getProductSymbols()
  spotSymbols.forEach(id => map.set(symbolToCommon(id), id))
  return map
}

function symbolToCommon(symbol)
{
  // ETH-EUR => etheur
  return symbol.replace('-', '').toLowerCase()
}

async function getBestBidAsk(id)
{
  let book = await client.rest.product.getProductOrderBook(id, {level:OrderBookLevel.ONLY_BEST_BID_AND_ASK})
  let bidObj = book.bids[0]
  let askObj = book.asks[0]
  let bidPrice = Number(bidObj[0])
  let bidAmount = Number(bidObj[1])
  let askPrice = Number(askObj[0])
  let askAmount = Number(askObj[1])
  return {bidPrice, bidAmount, askPrice, askAmount}

}

// orderbook has levels on coinbase pro... 3 levels
async function getOrderBook(id)
{
  /*
    export declare enum OrderBookLevel {
      ONLY_BEST_BID_AND_ASK = 1,
      TOP_50_BIDS_AND_ASKS = 2,
      FULL_ORDER_BOOK = 3
    }
  */
  // If 50 fake bids/asks are on top, the approach of only picking the "best" ones might not work
  // For example 50x0.000001 bids/asks
  // However for arb purposes getting full book is wasteful
  let orderbook = await client.rest.product.getProductOrderBook(id, {level:OrderBookLevel.TOP_50_BIDS_AND_ASKS})
  // Orderbook from coinbase is on the form {bids: [[e0, e1, e2], ...], asks: [[e0, e1, e2], ...]}
  // 

  // Level 2: Order entry = [ price, size, num-orders ]
  // Level 3: Order entry = [ price, size, order_id ]
  // Each element is a string, so they need to be converted to number
  // One entry example for ETH-EUR: [ '1562.29', '0.00199022', 1 ]
  // Ordering is: highest bid first in list, lowest ask is first in list
  // This is unlike other exchanges (bitfinex & binance), where highest bid is last in the list
  // This is more sane though
  // For now the bid list has to be sorted in ascending order on the price prop
  // but in the future the books should be ordered like coinbase api returns them

  let bids = new Array()
  let asks = new Array()

  orderbook.asks.forEach(entry => {
    const orderEntry = {price: Number(entry[0]), amount: Number(entry[1])}
    asks.push(orderEntry)
  })

  orderbook.bids.forEach(entry => {
    const orderEntry = {price: Number(entry[0]), amount: Number(entry[1])}
    bids.push(orderEntry)
  })

  // sort bids in ascending order so first entry has the lowest bid (like binance and bitfinex)
  bids.sort((e1,e2) => e1.price - e2.price)

  return {bids, asks}
}

/*
async function test()
{
  //console.log(await client.rest.product.getProducts())
  //console.log(await getProductSymbols())
  console.log(await getCommonSpotSymbolMap())
  console.log(await getOrderBook("ETH-EUR"))
  console.log(await getBestBidAsk("ETH-EUR"))
  
}

test()

*/

module.exports = {getOrderBook, getBestBidAsk, getCommonSpotSymbolMap}