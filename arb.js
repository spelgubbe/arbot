

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

  const buy1sell2 = getProfitFraction(lowestAsk1, highestBid2, feeMult1, feeMult2)
  const buy2sell1 = getProfitFraction(lowestAsk2, highestBid1, feeMult2, feeMult1)

  if (buy1sell2 > 0)
  {
    return [true, buy1sell2, {sell: 1, buy: 0}] // this is ugly
  } else if (buy2sell1 > 0)
  {
    return [true, buy2sell1, {sell: 0, buy: 1}]
  }
  return [false, buy1sell2, buy2sell1]

}

function getProfitFraction(lowestAsk, highestBid, buyFee, sellFee)
{
  const buyRate = lowestAsk*buyFee

  const sellRate = highestBid/sellFee

  return (sellRate - buyRate) / buyRate
}

module.exports = {compareBooks}
