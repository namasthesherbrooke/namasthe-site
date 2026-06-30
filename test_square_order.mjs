import { SquareClient, SquareEnvironment } from 'square';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function check() {
  try {
    const { result } = await squareClient.orders.searchOrders({
      locationIds: [process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID],
      limit: 1,
      query: {
        sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' }
      }
    });
    console.log(JSON.stringify(result.orders[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}
check();
