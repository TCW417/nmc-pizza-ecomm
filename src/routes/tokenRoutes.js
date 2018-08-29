//
// These are the token request handlers
//

import _data from '../lib/data';
import helpers from '../lib/helpers';

// request handlers
const handlers = {};

// base handler
handlers.tokens = (data, cb) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, cb);
  }
};

// container for all the token methods
handlers._tokens = {};

// tokens post
// Required data: email, password
// Optional data: none
handlers._tokens.post = (data, cb) => {
  const email = typeof data.payload.email === 'string'
    && data.payload.email.trim().length > 5
    && data.payload.email.indexOf('@') > 0
    ? data.payload.email.trim() : false;
  const password = typeof data.payload.password === 'string'
    && data.payload.password.trim().length > 0
    ? data.payload.password.trim() : false;

  if (!(email && password)) return cb(400, { Error: 'Missing required fields' });

  // lookup the user who matches that email address
  _data.read('users', email, (err, userData) => {
    if (err) return cb(400, { Error: 'Could not find the specified user' });

    // has password so we can compare to saved hash
    const hashedPassword = helpers.hash(password);
    if (hashedPassword !== userData.hashedPassword) return cb(500, { Error: 'Password did not match the specified user\'s stored password' });

    // good to go. Create token with 1 hr expiration date
    const tokenId = helpers.createRandomString(20);
    const expires = Date.now() + (1000 * 60 * 60);
    const token = {
      email,
      id: tokenId,
      expires,
    };

    // store the token
    _data.create('tokens', tokenId, token, (cerr) => {
      if (cerr) return cb(500, { Error: 'Could not create new token' });
      return cb(200, token);
    });
    return undefined;
  });
};

// tokens get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, cb) => {
  // check that the id provided is valid (from query)
  const id = typeof data.query.id === 'string'
    && data.query.id.trim().length === 20 
    ? data.query.id.trim()
    : false;
  
  if (!id) return cb(400, { Error: 'Missing required field' });

  _data.read('tokens', id, (err, tokenData) => {
    if (err) return cb(404, { Error: 'Token not found' });
    return cb(200, tokenData);
  });
  return undefined;
};

// tokens put (allow users to extend expiration another hr)
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, cb) => {
  const id = typeof data.payload.id === 'string'
    && data.payload.id.trim().length === 20 
    ? data.payload.id.trim()
    : false;
  const extend = typeof data.payload.extend === 'boolean'
    && data.payload.extend === true; 

  if (!(id && extend)) return cb(400, { Error: 'Missing required fields or fields invalid' });

  // lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (err) return cb(400, { Error: 'The specified token does not exist' });

    // make sure token isn't already expired
    if (tokenData.expires <= Date.now()) return cb(400, { Error: 'Token expired. Cannot be expended' });

    tokenData.expires = Date.now() + (1000 * 60 * 60);

    // store the new token
    _data.update('tokens', id, tokenData, (uerr) => {
      if (uerr) {
        console.log(err);
        return cb(500, { Error: 'Could not update the token' });
      }
      return cb(200);
    });
    return undefined;
  });
  return undefined;
};

// tokens delete
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, cb) => {
  const id = typeof data.query.id === 'string'
    && data.query.id.trim().length === 20 
    ? data.query.id.trim()
    : false;
  if (!id) return cb(400, { Error: 'Missing required field' });

  _data.read('tokens', id, (rerr) => {
    if (rerr) return cb(404, { Error: 'Specified token not found' });

    _data.delete('tokens', id, (derr) => {
      if (derr) return cb(404, { Error: 'Token not found' });
      return cb(200);
    });
    return undefined;
  });
  return undefined;
};

export default handlers;
