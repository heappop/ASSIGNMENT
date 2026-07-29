const test = require('node:test');
const assert = require('node:assert/strict');

const nominatimClient = require('../src/clients/nominatim.client');

nominatimClient.searchCity = async () => ({
  status: 'ok',
  data: [
    {
      name: 'Jaipur',
      lat: '26.9124',
      lon: '75.7873',
      display_name: 'Jaipur, Rajasthan, India',
      countryCode: 'in',
      country: 'India'
    }
  ]
});

const { resolveCity } = require('../src/services/destination.service');
const { getFx } = require('../src/clients/fx.client');

test('resolveCity uses the country code from Nominatim', async () => {
  const result = await resolveCity('jaipur');

  assert.equal(result.countryCode, 'IN');
  assert.equal(result.country, 'India');
});

test('getFx returns INR as the default currency without external lookup', async () => {
  const result = await getFx('INR');

  assert.equal(result.status, 'ok');
  assert.equal(result.data.currency, 'INR');
  assert.equal(result.data.rateToInr, 1);
});

test('getDestinations handles Nominatim lookup failures without crashing', async () => {
  const nominatimClient = require('../src/clients/nominatim.client');
  nominatimClient.searchCity = async () => ({
    status: 'error',
    error: 'upstream_error'
  });

  delete require.cache[require.resolve('../src/services/destination.service')];
  const { getDestinations } = require('../src/services/destination.service');

  const result = await getDestinations(['jaipur']);

  assert.equal(result.destinations[0].blocks.weather.status, 'error');
  assert.equal(result.destinations[0].resolved, null);
});
