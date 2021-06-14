const {ArbitrageEngine} = require('./ArbitrageEngine')


const timer = ms => new Promise(res => setTimeout(res, ms))

const testIterations = 5;

async function executionLoop()
{
  let engine = new ArbitrageEngine()
  await engine.setup()
  
  // will be an infinite loop
  for (var i = 0; i < testIterations; i++) {
    engine.tick()
    await timer(3000);
  }
}

executionLoop()