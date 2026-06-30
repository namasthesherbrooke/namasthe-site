import { SquareClient, SquareEnvironment } from 'square';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function check() {
  console.log("Orders API:", !!squareClient.ordersApi);
  console.log("Orders:", !!squareClient.orders);
}
check();
