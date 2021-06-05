## Arbitrage finding bot

**DISCLAIMER: Use at your own risk. Arbitrage is not risk free.**  

Idea for the bot is to fetch tickers from multiple exchanges and compare current ask/bid prices 
of the trading pairs which they have in common.
Differences in prices which cross a certain threshold consistitutes an arbitrage opportunity.

[Not yet implemented] Opportunities are further evaluated by fetching the orderbooks of
both exchanges and examining the buy/sell liquidity on both. Then you could present the potential percentage gains
for different order sizes.

## What is arbitrage
If you can buy the asset for a lower price on one exchange than you can sell it on another exchange,
it's possible to earn money on the difference minus any trading fees. 
**However, some currencies may for a long time, or permanently trade at different prices on different 
exchanges, for example due to broken exchange wallets.**

**This tool should therefore only be used on currency pairs and exchanges which you trust**  
**If the arbitrage process is to be automated, it makes sense from a risk perspective to only deal with a 
limited set of exchanges and currency pairs, which are explicitly whitelisted by the user. 
In addition, capital allocated to each trade should preferably be limited and not grow over time. 
If you are wrong and prices aren't converging for a longer period of time, it doesn't make sense to risk more capital.**


There are two ways of taking advantage of price differences between exchanges:
- If you hold the asset on the exchange with higher price, you can sell the asset there, 
and buy it on the lower priced exchange, given that you own the quote currency at the lower priced exchange
- If you hold the asset on none of the exchanges, but got access to margin on the higher priced exchange, 
then you can short the asset on the higher priced exchange and buy it on the lower priced exchange. Then you'd 
wait for the prices to start trading closer to each other. **This exposes you to liquidation risk on the higher 
priced exchange.**

## TODO
- [ ] Switch to fetching tickers first and only using orderbooks when tickers indicate price differences
- [ ] Improve UI
- [ ] Implement triangle arbitrage (arbitrage which can take place on one exchange)
- [ ] Explore using websockets instead of using REST API (because speed)
- [ ] Ensure not going above API rate limits
