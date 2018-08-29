//
// routes for ordering what's in the cart
//
import stripe from 'stripe';

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
        source: config.TEST_STRIPE_TOKEN, // obtained with Stripe.js
        description: `Pizza charge for ${tokenData.email}`,
      }, (err, charge) => {
        if (err) return cb(500, { Error: `Stripe API error:\n${err}` }); 
        const { status, amount } = charge;
        return cb(200, { status, amount });
      });
      return undefined;
    });
    return undefined;
  });
};

export default handlers;
