import { SquareClient, SquareEnvironment } from 'square';
const client = new SquareClient({ environment: SquareEnvironment.Sandbox, token: 'test' });
console.log('ordersApi:', Object.keys(client.ordersApi || {}));
console.log('checkoutApi:', Object.keys(client.checkoutApi || {}));
console.log('orders:', Object.keys(client.orders || {}));
console.log('checkout:', Object.keys(client.checkout || {}));
