//
// routes for ordering what's in the cart
//
import stripe from 'stripe';
import Mailgun from 'mailgun-js';

import _data from '../lib/data';
import config from '../config';

const myStripe = stripe(config.TEST_STRIPE_API_KEY);

// request handlers
const handlers = {};

// base handler
handlers.order = (data, cb) => {
  const acceptableMethods = ['post'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._order[data.method](data, cb);
  }
};

// container for all the token methods
handlers._order = {};

// order post
// Required data: a cart file and a valid token
// Optional data: none
handlers._order.post = (data, cb) => {
  // validate the card token the client should have received from stripe
  const cardToken = typeof data.payload.cardToken === 'string' && data.payload.cardToken.length > 0
    ? data.payload.cardToken : false;
  if (!cardToken) return cb(400, { Error: 'Invalid Strip charge card token' });

  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // read the token data
  _data.read('tokens', token, (terr, tokenData) => {
    if (terr || !tokenData) return cb(403, { Error: 'Missing or invalid token' });
    // verify that the token has not expired
    if (tokenData.expires < Date.now()) return cb(403, { Error: 'Token has expired' });
    
    _data.read('carts', tokenData.email, (rerr, cartData) => {
      if (rerr) return cb(404, { Error: 'Cart not found' });
      if (!(typeof cartData === 'object' && cartData instanceof Array)) cb(500, { Error: 'Malformed cart JSON' });

      // calculate cart total (in cents) from extPrice properties of each item
      const cartTotal = Math.round(cartData.reduce((acc, curr) => { return acc + curr.extPrice; }, 0) * 100);

      if (cartTotal < 50) return cb(400, { Error: 'Cart total too small to charge using Stripe API' });

      myStripe.charges.create({
        amount: cartTotal,
        currency: 'usd',
        source: cardToken, // obtained with Stripe.js
        description: `Pizza charge for ${tokenData.email}`,
      }, (err, charge) => {
        if (err) return cb(500, { Error: `Stripe API error:\n${err}` }); 
        const { status, amount } = charge;

        // charge succeeded, send customer email receipt
        const mailgun = new Mailgun({ apiKey: config.MAILGUN_PRIVATE_API_KEY, domain: config.MAILGUN_DOMAIN });

        const cartMessageString = cartData.reduce((str, item) => `${str}<tr><td>${item.name}</td><td>${item.size}</td><td>${item.qty}</td><td>${item.price}</td><td>${item.extPrice}</td></tr>`, '');

        const message = {
          from: 'selpilot@gmail.com',
          to: tokenData.email, 
          subject: 'Receipt for your recent Pizza order',
          html: `<p>Thank you for your recent order!  Here is your receipt:</p><table><tr><th>Item</th><th>Size</th></th><th>Qty</th><th>Price</th><th>Extended Price</th></tr>${cartMessageString}<tr><td colspan=4>Total:</td><td>${cartTotal / 100}</td></tr>`,
        };
        mailgun.messages().send(message, (mgerr, body) => {
          if (mgerr) return cb(200, { Error: `Charge successful but receipt email failed: ${mgerr}` });
          // Else respond with 200 and charge status info
          return cb(200, { chargeStatus: status, chargeAmount: amount / 100, emailStatus: body.message });
        });
        return undefined;
      });
      return undefined;
    });
    return undefined;
  });
  return undefined;
};

export default handlers;
