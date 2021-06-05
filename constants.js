const EXCHANGE = {
  BITFINEX: 0,
  KRAKEN: 1,
  COINBASE: 2,
  POLONIEX: 3,
  BINANCE: 4,
  BITTREX: 5,
  KUCOIN: 6
}

// this is garbage, should be a class
// need to make an exchange class for sure
const TRADING_FEES = [
  {maker:0.001, taker:0.002}, // 15% off on taker fee at Bitfinex given enough LEO holdings, on some pairs
  {maker:0.0008, taker:0.002}
  {maker:0.0035, taker:0.0035} // will scale from volume
  {maker:0.00095, taker:0.00095} // 0.0950% / 0.0950% given TRX balance > $50
  {maker:0.00075, taker:0.00075} // given BNB used for fees - implies need to buyback BNB as it will go towards zero
  {maker:0.0008, taker:0.002} // will fill out later
  {maker:0.0008, taker:0.002} // no idea of fees here
]


module.exports = {EXCHANGE}