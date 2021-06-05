

function triangleArb(allPairs)
{
  // TODO: The idea here is to look at all pairs for a currency. Eg. ETH-USD, ETH-EUR, ETH-BTC
  // If ETH-BTC price is > ETH-USD/BTC-USD then:
  //    ETH can be sold for BTC, then BTC is sold to USD, then USD is sold for ETH
  // It's not expected that this happens on a high liquidity exchange
  // On lower liquidity exchanges price may be moved enough to make such a deal profitable

  // The function could return a fraction which represents profit
  // and a description of how to perform the trade, eg. ETH->BTC->USD->ETH
  // In addition, the upper/lower limits for the execution prices of each trade need to be returned too
  // The books need to be checked simultaneously or already be up to date

  // (out of scope for this function)
  // Dealing with a failed arbitrage attempt has to be done too, if orders are pulled 
  // However, keeping track of the age of an order could help with this
  // An old order could be expected to have a higher probability of remaining while the order is executed
  // Remembering best bids and asks and timestamping them, or timestamping order-ids could help with this
}

// TODO: sensible name
function compareBooks(B1, B2, fee1, fee2)
{
  // compare two books, coming from different exchanges, for profitable arbitrage
  // As MVP just check highest bids and lowest asks
  // If this returns true then the books should get more closely inspected

  // Abort if any of the books has either zero bids or zero asks
  if (B1.bids.length == 0 || B2.bids.length == 0) return [false]
  if (B1.asks.length == 0 || B2.asks.length == 0) return [false]

  const feeMult1 = 1+fee1
  const feeMult2 = 1+fee2

  // bids[0] = highest bid, asks[0] = lowest ask
  const highestBid1 = B1.bids[0].price
  const highestBid2 = B2.bids[0].price

  const lowestAsk1 = B1.asks[0].price
  const lowestAsk2 = B2.asks[0].price

  const buy1sell2 = getProfitFraction(lowestAsk1, highestBid2, feeMult1, feeMult2)
  const buy2sell1 = getProfitFraction(lowestAsk2, highestBid1, feeMult2, feeMult1)

  // TODO: return in sensible format

  if (buy1sell2 > 0)
  {
    return [true, buy1sell2, {sell: 1, buy: 0}]
  } else if (buy2sell1 > 0)
  {
    return [true, buy2sell1, {sell: 0, buy: 1}]
  }
  return [false, buy1sell2, buy2sell1]

}


function compareBestBidAsk(bidask1, bidask2, fee1, fee2)
{
  const feeMult1 = 1+fee1
  const feeMult2 = 1+fee2

  const highestBid1 = bidask1[0]
  const highestBid2 = bidask2[0]

  const lowestAsk1 = bidask1[1]
  const lowestAsk2 = bidask2[1]

  const buy1sell2 = getProfitFraction(lowestAsk1, highestBid2, feeMult1, feeMult2)
  const buy2sell1 = getProfitFraction(lowestAsk2, highestBid1, feeMult2, feeMult1)

  if (buy1sell2 > 0)
  {
    return [true, buy1sell2, {sell: 1, buy: 0}]
  } else if (buy2sell1 > 0)
  {
    return [true, buy2sell1, {sell: 0, buy: 1}]
  }
  return [false, buy1sell2, buy2sell1]

}

/**
 * 
 * @param {Number} buyPrice Buying price
 * @param {Number} sellPrice Selling price
 * @param {Number} buyFee Fee on exchange where the buy is made
 * @param {Number} sellFee Fee on exchange where the sell is made
 * @returns {Number} A number representing the profit
 */
function getProfitFraction(buyPrice, sellPrice, buyFee, sellFee)
{
  const buyRate = buyPrice*buyFee

  const sellRate = sellPrice/sellFee

  return (sellRate - buyRate) / buyRate
}

module.exports = {compareBooks, compareBestBidAsk}
