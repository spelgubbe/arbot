const utility = require('../utility')

test('check common symbols', () => {
	let m1 = new Map() // get example from some exchange
	let m2 = new Map() // get example from some exchange

	let expected = [] // get example from data
	
	let result = utility.getCommonSymbolsList(m1, m2)

	// sort to not make order matter
	expect(result.sort()).toEqual(expected.sort())
})

test('check union', () => {
	let s1 = new Set(["a", "b", "c", "d", "e"])
	let s2 = new Set(["c", "b", "z", "a"])

	let expected = new Set(["a", "b", "c", "d", "e", "z"])

	let result = utility.getSymbolSetUnion(s1, s2)

	expect(result).toEqual(expected)

})

test('check intersection', () => {
	let s1 = new Set(["a", "b", "c", "d", "e"])
	let s2 = new Set(["c", "b", "z", "a"])

	let expected = new Set(["a", "b", "c"])

	let result = utility.getSymbolSetIntersection(s1, s2)

	expect(result).toEqual(expected)
})