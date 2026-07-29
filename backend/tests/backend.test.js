const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MOCK = '1';

const { getFx } = require('../src/clients/fx.client');
const cache = require('../src/cache/cache');

test('getFx returns INR semantics for INR requests', async () => {
  cache.clear();

  const result = await getFx('INR');

  assert.equal(result.status, 'ok');
  assert.equal(result.data.currency, 'INR');
  assert.equal(result.data.rateToInr, 1);
});
