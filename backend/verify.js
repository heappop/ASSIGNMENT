const { searchCity } = require('./src/clients/nominatim.client');

(async () => {
  try {
    const result = await searchCity('jaipur');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
