/**
 * 
 * @param {Array<Object>} arbs Array of objects with keys `size`, `sellDetails`, `buyDetails`
 * 
 * @returns {Array<Object>} Copy of array sorted on profit, with an additional prop `profit`
 */
function sortedByProfitPct(arbs)
{
  // Sort on percentage gain (could be negative), descending order

  let editedArbs = []

  for(let {size, sellDetails, buyDetails} of arbs)
  {
    // Assumption: size == sellDetails.units == buyDetails.units
    const sellPrice = size * sellDetails.costPerUnit
    const buyPrice = size * buyDetails.costPerUnit

    const profitFraction = (sellPrice - buyPrice) / buyPrice

    editedArbs.push({size, sellDetails, buyDetails, profit: profitFraction})
  }

  editedArbs.sort(({profit:p1},{profit:p2}) => {return p2-p1}) // descending order
}

/**
 * 
 * @param {Object} bidList sorted orders to sell into
 * @param {Object} askList sorted orders to buy into
 * @param {Number} low lower bound on notional
 * @param {Number} high upper bound on notional
 * @returns {Array<Object>} Array of objects with keys testSize, sellDetails, buyDetails
 */
function testArbNominal(bidList, askList, low, high)
{
  // test different order sizes
  // maybe this is the wrong end of the problem
  // TODO:
  // the purpose is to not waste capital into orders which
  // yield no additional profit

  let choices = []
  const numTests = 10
  const range = high - low

  for(let i = 0; i < numTests; i++)
  {
    let testSize = low + range*(i/numTests)
    // TODO:
    // Could do this in another way
    // gather asks/bids dependent on each other, instead of independent
    // if X units can be sold on exchange A then no more than X units should 
    // be sought out on exchange B
    const sellDetails = simulateTradeFixedNominator(askList, testSize)
    const buyDetails = simulateTradeFixedNominator(bidList, testSize)
    choices.push({testSize, sellDetails, buyDetails})
  }

  return choices
}

/**
 * 
 * @param {Array<Object>} sortedOrders Array of orders sorted in logical order (asc for bids, desc for asks)
 * @param {Number} numUnits Units to be bought (simulated)
 * 
 * @returns {Object} Object with keys cost, costPerUnit, units
 */
function simulateTradeFixedNominator(sortedOrders, numUnits)
{
  let cost = 0.0 // total cost in denominator
  let remainingUnits = numUnits // units = nominator
  for(let order of sortedOrders)
  {
    const {price, amount} = order
    if (amount < remainingUnits)
    {
      remainingUnits -= amount
      cost += price * amount
    } else 
    {
      let unitsToBuy = remainingUnits
      remainingUnits = 0
      cost += price * unitsToBuy
    }
  }
  const filledUnits = numUnits-remainingUnits
  const costPerUnit = cost/filledUnits

  return {cost, costPerUnit, units: filledUnits}
}

/**
 * 
 * @param {Array<Object>} sortedOrders Array of orders sorted in logical order (asc for bids, desc for asks)
 * @param {Number} maxCost Maximum cost of the simulated orders 
 * 
 * @returns {Object} Object with keys cost, costPerUnit, units
 */
function simulateTradeFixedDenominator(sortedOrders, maxCost)
{
  let cost = 0.0 // total cost in denominator
  let numUnits = 0
  let remainingCost = maxCost
  for(let order of sortedOrders)
  {
    const {price, amount} = order
    const orderCost = price*amount
    if (orderCost < remainingCost)
    {
      numUnits += amount
      remainingCost -= orderCost
      cost += orderCost
    } else 
    {

      let additionalCost = remainingCost
      let additionalUnits = additionalCost/price
      remainingCost = 0
      numUnits += additionalUnits
      cost += additionalCost
    }
  }
  const filledUnits = numUnits
  const costPerUnit = cost/filledUnits

  return {cost, costPerUnit, units: filledUnits}
}

module.exports = {
  simulateTradeFixedNominator, simulateTradeFixedDenominator
}
