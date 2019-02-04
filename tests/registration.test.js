const { sum } = require('../sum');

test('Adding 1 + 1 equals 2', () => {
  console.log(sum.toString());
  expect(sum(1, 1)).toBe(2);
});
