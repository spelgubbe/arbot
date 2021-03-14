/**
 * 
 * @param {Map} S1 
 * @param {Map} S2 
 * 
 * @returns {Array} array of common keys
 */
function getCommonSymbols(S1, S2)
{
  // S1 and S2 are maps
  let s1Size = S1.size
  let s2Size = S2.size

  let smallestMap = s1Size < s2Size ? S1 : S2
  let biggestMap = s1Size < s2Size ? S2 : S1
  let union = new Array()

  for (let key of smallestMap.keys())
  {
    if (biggestMap.has(key))
    {
      union.push(key)
    }
  }

  return union
}

// TODO: get common symbols but with variable number of maps

function triangleArb()
{
  // TODO:
}

// Another form of arb is having an order in the book ready
// on one side, and when its taken 
// you do the trade on the other side
// returns ugly array
function compareBooks(B1, B2, fee1, fee2)
{
  // compare two books, coming from different exchanges, for profitable arbitrage
  // As MVP just check highest bids and lowest asks
  // If this returns true then the books should get more closely inspected
  // Fees are expected to be something like 0.00075 for 0.075%

  // Abort if any of the books has either zero bids or zero asks
  if (B1.bids.length == 0 || B2.bids.length == 0) return [false]
  if (B1.asks.length == 0 || B2.asks.length == 0) return [false]

  /* TODO:
  Make this smarter, even if 1 ask/bid exists an arb can be done
  However, then a lot of edge cases need to be considered.
  */

  const feeMult1 = 1+fee1
  const feeMult2 = 1+fee2

  // TODO: more logical order is that first element is the "best deal"
  const highestBid1 = B1.bids[B1.bids.length-1].price
  const highestBid2 = B2.bids[B2.bids.length-1].price

  const lowestAsk1 = B1.asks[0].price
  const lowestAsk2 = B2.asks[0].price

  // Effective buying price of a market buy on exchange 1 and exchange 2 respectively
  const m1BuyRate = lowestAsk1*feeMult1
  const m2BuyRate = lowestAsk2*feeMult2

  // Effective selling price of a market buy on exchange 1 and exchange 2 respectively
  const m1SellRate = highestBid1/feeMult1
  const m2SellRate = highestBid2/feeMult2

  // these cases are mutually exclusive

  if (m1BuyRate < m2SellRate) // m1 buy, m2 sell
  {
    let percentageGain = calcPercentageGain(m1BuyRate, m2SellRate)
    return [true, percentageGain, {sell: 1, buy: 0}]
  }

  // possibility of buying at exchange 2 at market and selling on exchange 1 at market
  else if (m2BuyRate < m1SellRate) // m2 buy, m1 sell
  {
    let percentageGain = calcPercentageGain(m2BuyRate, m1SellRate)
    return [true, percentageGain, {sell: 0, buy: 1}]
  }

  // TODO: add info which could help with, like at which price it would be profitable to arb
  return [false, m1BuyRate, m2BuyRate, m1SellRate, m2SellRate]
}

function calcPercentageGain(buyPrice, sellPrice)
{
  return (sellPrice - buyPrice) / buyPrice
}

module.exports = {getCommonSymbols, compareBooks}
