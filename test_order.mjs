import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function testOrder() {
  try {
    const orderRequest = {
      idempotencyKey: crypto.randomUUID() + '_order',
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        lineItems: [
          {
            name: "Test",
            quantity: "1",
            basePriceMoney: {
              amount: BigInt(100),
              currency: 'CAD'
            }
          }
        ],
        taxes: [
          {
            name: "TPS/TVQ",
            percentage: "14.975",
            scope: "ORDER"
          }
        ],
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: {
              scheduleType: "ASAP",
              recipient: {
                displayName: "Test Client",
                emailAddress: 'test@namasthe.com'
              }
            }
          }
        ]
      }
    };
    
    const res = await squareClient.orders.create(orderRequest);
    console.log("Success:", Object.keys(res));
    if (res.order) console.log("OrderID:", res.order.id);
    else if (res.data) console.log("OrderID:", res.data.order.id);
  } catch (err) {
    if (err.errors) console.error("API Errors:", err.errors);
    else console.error(err);
  }
}
testOrder();
