/**
 * 
 * @param {Map} S1 
 * @param {Map} S2 
 * 
 * @returns {Array} array of common keys
 */
function getCommonKeysList(S1, S2)
{
  // S1 and S2 are maps
  let s1Size = S1.size
  let s2Size = S2.size

  let smallestMap = s1Size < s2Size ? S1 : S2
  let biggestMap = s1Size < s2Size ? S2 : S1
  let intersection = new Array()

  for (let key of smallestMap.keys())
  {
    if (biggestMap.has(key))
    {
      intersection.push(key)
    }
  }

  return intersection
}

/**
 * 
 * @param  {Object[]} lst 
 */
function getAllPairs(lst)
{
  //console.log(lst)
  let pairsArr = new Array()
  for(var i = 0; i < lst.length; i++)
  {
    for(var j = i+1; j < lst.length; j++)
    {
      // assert i != j && j > i
      // for each pair (i,j)
      //var isect = getSymbolSetIntersection(lst[i], lst[j])
      pairsArr.push([lst[i], lst[j]])
    }
  }
  return pairsArr
}

// TODO: get common symbols but with variable number of maps
// TODO: move these functions out of arb.js

/**
 * Get union of two sets (but arrays of strings will work too).
 * 
 * @param {Set<string>} S1 
 * @param {Set<string>} S2 
 * 
 * @returns {Set<string>} Union of S1 and S2
 */
function getSetUnion(S1, S2)
{
  let newSet = new Set()
  S1.forEach(val => newSet.add(val))
  S2.forEach(val => newSet.add(val))
  return newSet
}

/**
 * Get intersection of two sets (but arrays of strings will work too).
 * 
 * @param {Set<string>} S1 
 * @param {Set<string>} S2 
 * 
 * @returns {Set<string>} Intersection of S1 and S2
 */
function getSetIntersection(S1, S2)
{
  let newSet = new Set()
  S1.forEach(elem => {
    if (S2.has(elem)) {
      newSet.add(elem)
    }
  })
  return newSet
}

/*
async function test()
{
  let arr = ["a","b","c"]
  getAllSymbolIntersections(arr)
}
test()
*/
module.exports = {getCommonKeysList, getSetUnion, getSetIntersection, getAllPairs}