//
// These are the cart request handlers
//

import _data from '../lib/data';

// request handlers
const handlers = {};

// base handler
handlers.cart = (data, cb) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, cb);
  }
};

// container for all the cart methods
handlers._cart = {};

// cart post
// Required data: menuId, size, qty
// Optional data: none
handlers._cart.post = (data, cb) => {
  // get the token from the header, check for expiration. save email as cart name
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // read the token data
  _data.read('tokens', token, (terr, tokenData) => {
    if (terr || !tokenData) return cb(403, { Error: 'Missing or invalid token' });
    // verify that the token has not expired
    if (tokenData.expires < Date.now()) return cb(403, { Error: 'Token has expired' });
    const cartName = tokenData.email;

    // get the menu
    _data.read('menu', 'pizza-menu', (merr, menu) => {
      // get array of menuIds
      const menuIds = menu.map(i => i.id); 
      if (merr || !menu) return cb(500, { Error: 'Unable to read menu data' });
      // validate payload properties menuId, size, qty
      const menuItem = typeof data.payload.menuId === 'number' && menuIds.includes(data.payload.menuId)
        ? data.payload.menuId : false;
      const quantity = typeof data.payload.qty === 'number' ? data.payload.qty : false;
      const itemSize = typeof data.payload.size === 'string' 
        && ['small', 'medium', 'large'].includes(data.payload.size.trim())
        ? data.payload.size.trim() : false;
      if (!(menuItem && quantity && itemSize)) return cb(400, { Error: 'Bad request. Invalid item data' });

      // create order item object
      // get the menu item
      const menuItemObj = menu.filter(i => i.id === menuItem)[0];
      // build cartItem
      const newCartItem = {
        type: menuItemObj.type,
        name: menuItemObj.name,
        size: itemSize,
        qty: quantity,
        price: menuItemObj[itemSize],
        extPrice: Math.round(quantity * menuItemObj[itemSize] * 100) / 100, //.toFixed(2),
      };
      // build new cart just in case
      const newCart = [newCartItem];
      
      // if cart doesn't exists, create it and exit
      if (!_data.exists('carts', cartName)) {
        _data.create('carts', cartName, newCart, (err) => {
          if (err) return cb(500, { Error: `Unable to create new cart: ${err}` });
          return cb(200);
        });
      } else {
        // read cart file and update it with new item
        _data.read('carts', cartName, (err, cartData) => {
          if (err || !cartData) return cb(500, { Error: `Unable to read existing cart file: ${err}` });
          cartData.push(newCartItem);
          _data.update('carts', cartName, cartData, (uerr) => {
            if (uerr) return cb(500, { Error: `Unable to update existing cart: ${err}` });
            return cb(200);
          });
          return undefined;
        });
      }
      return undefined;
    });
    return undefined;
  });
};

// cart get
// Required data: none
// Optional data: none
handlers._cart.get = (data, cb) => {
  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // read the token data
  _data.read('tokens', token, (terr, tokenData) => {
    if (terr || !tokenData) return cb(403, { Error: 'Missing or invalid token' });
    // verify that the token has not expired
    if (tokenData.expires < Date.now()) return cb(403, { Error: 'Token has expired' });
    
    _data.read('carts', tokenData.email, (err, cartData) => {
      if (err) return cb(404, { Error: 'Cart file not found' });
      return cb(200, cartData);
    });
    return undefined;
  });
};

// cart put
// Required data: updated cart array object
// Optional data: none
handlers._cart.put = (data, cb) => {
  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // read the token data
  _data.read('tokens', token, (terr, tokenData) => {
    if (terr || !tokenData) return cb(403, { Error: 'Missing or invalid token' });
    // verify that the token has not expired
    if (tokenData.expires < Date.now()) return cb(403, { Error: 'Token has expired' });
    
    _data.update('carts', tokenData.email, data.payload, (err, cartData) => {
      if (err) return cb(500, { Error: `Unable to update cart: ${err}` });
      return cb(200, cartData);
    });
    return undefined;
  });
};

// cart delete
// Required data: none (cart name taken from token)
// Optional data: none
handlers._cart.delete = (data, cb) => {
  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // read the token data
  _data.read('tokens', token, (terr, tokenData) => {
    if (terr || !tokenData) return cb(403, { Error: 'Missing or invalid token' });
    // verify that the token has not expired
    if (tokenData.expires < Date.now()) return cb(403, { Error: 'Token has expired' });
    
    _data.delete('carts', tokenData.email, (err) => {
      if (err) return cb(500, { Error: `Unable to delete cart: ${err}` });
      return cb(200);
    });
    return undefined;
  });
};

export default handlers;
