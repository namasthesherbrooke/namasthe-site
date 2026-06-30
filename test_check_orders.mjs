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
      limit: 3,
      query: {
        sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' }
      }
    });
    
    result.orders.forEach((o, i) => {
      console.log(`Order ${i}: ID=${o.id}, State=${o.state}, Fulfillments=${o.fulfillments ? o.fulfillments.length : 0}`);
      if (o.fulfillments) {
        console.log("Fulfillment 0 state:", o.fulfillments[0].state, o.fulfillments[0].type);
      }
    });
  } catch (err) {
    console.error(err);
  }
}
check();
