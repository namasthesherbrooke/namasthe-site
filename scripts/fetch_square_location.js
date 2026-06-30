const { SquareClient, SquareEnvironment } = require('square');

const squareClient = new SquareClient({
  token: 'EAAAl3SsZ71mYwoEcS3GUwmheyyBTTPIExpVrJVzu6jdaGrtCp0_ieLxQveynH-i',
  environment: SquareEnvironment.Production,
});

async function getLocations() {
  try {
    const response = await squareClient.locationsApi.listLocations();
    const locations = response.result.locations;
    if (locations && locations.length > 0) {
      console.log('LOCATION_ID_FOUND:', locations[0].id);
    } else {
      console.log('No locations found.');
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
  }
}

getLocations();
