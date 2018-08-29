//
// These are the menu request handlers
//

import _data from '../lib/data';

// request handlers
const handlers = {};

// base handler
handlers.menu = (data, cb) => {
  const acceptableMethods = ['get'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, cb);
  }
};

// container for all the token methods
handlers._menu = {};

// tokens get
// Required data: none
// Optional data: none
handlers._menu.get = (data, cb) => {
  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // read the token data
  _data.read('tokens', token, (terr, tokenData) => {
    if (terr || !tokenData) return cb(403, { Error: 'Missing or invalid token' });
    // verify that the token has not expired
    if (tokenData.expires < Date.now()) return cb(403, { Error: 'Token has expired' });
    
    _data.read('menu', 'pizza-menu', (err, menuData) => {
      if (err) return cb(404, { Error: 'Menu file not found' });
      return cb(200, menuData);
    });
    return undefined;
  });
};

export default handlers;
