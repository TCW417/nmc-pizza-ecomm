//
// These are the request handlers
//

import _data from '../lib/data';
import helpers from '../lib/helpers';

// request handlers
const handlers = {};

// base handler
handlers.users = (data, cb) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  }
};

// container for _users submethods
handlers._users = {};

// _users post
// Required data: firstName, lastName, email, address, password,
// tosAgreement. 
// Optional data: 2nd line of address
// users uniquely identified by their phone and password
handlers._users.post = (data, cb) => {
  // check that all require fields are filled out
  const firstName = typeof data.payload.firstName === 'string'
    && data.payload.firstName.trim().length > 0
    ? data.payload.firstName.trim() : false;
  const lastName = typeof data.payload.lastName === 'string'
    && data.payload.lastName.trim().length > 0
    ? data.payload.lastName.trim() : false;
  const email = typeof data.payload.email === 'string'
    && data.payload.email.trim().length > 10
    && data.payload.email.indexOf('@') > 0
    ? data.payload.email.trim() : false;
  const address1 = typeof data.payload.address1 === 'string'
    && data.payload.address1.trim().length > 0
    ? data.payload.address1.trim() : false;
  const address2 = typeof data.payload.address2 === 'string'
    ? data.payload.address2.trim() : ''; // because it's optional
  const city = typeof data.payload.city === 'string'
    && data.payload.city.trim().length > 0
    ? data.payload.city.trim() : false;  
  const state = typeof data.payload.state === 'string'
    && data.payload.state.trim().length === 2
    ? data.payload.state.trim().toUpperCase() : false; 
  const zipcode = typeof data.payload.zipcode === 'string'
    && data.payload.zipcode.trim().length > 0 // could be zip+4 so leave it a string
    ? data.payload.zipcode.trim() : false; 
  const password = typeof data.payload.password === 'string'
    && data.payload.password.trim().length > 0
    ? data.payload.password.trim() : false;
  const tosAgreement = typeof data.payload.tosAgreement === 'boolean'
    && data.payload.tosAgreement;
  
  if (!(firstName 
    && lastName 
    && email 
    && address1
    && city
    && state
    && zipcode
    && password 
    && tosAgreement)) {
    return cb(400, { Error: 'Missing or malformed required fields' });
  }

  // make sure the user doesn't already exist
  // try and read their data file. Error ==> they don't exist
  _data.read('users', email, (rerr) => {
    if (!rerr) return cb(400, { Error: 'A user with that email address already exists' });

    // no file found, valid new user post request
    // hash the user's password
    const hashedPassword = helpers.hash(password);
    if (!hashedPassword) return cb(500, { Error: 'Could not hash the user\'s password' });

    // create the user object
    const userObj = {
      firstName,
      lastName,
      email,
      address1,
      address2,
      city,
      state,
      zipcode,
      hashedPassword,
      tosAgreement,
    };

    // store the user
    _data.create('users', email, userObj, (cerr) => {
      if (!cerr) return cb(200);
      console.log(cerr);
      return cb(500, { Error: 'Could not create new user' });
    });
    return undefined;
  });
  return undefined;
};

// _users get
// Required data: email
// Optional data: none
handlers._users.get = (data, cb) => {
  // check that the email provided is valid (from query)
  const email = typeof data.query.email === 'string'
    && data.query.email.trim().length > 10
    && data.query.email.indexOf('@') > 0
    ? data.query.email.trim() : false;

  if (!email) return cb(400, { Error: 'Missing required field' });
  
  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;
  // verify that the token is valid for this user
  helpers.verifyToken(token, email, (tokenIsValid) => {
    if (!tokenIsValid) return cb(403, { Error: 'Missing required token in header or token is invalid' });

    _data.read('users', email, (err, userData) => {
      if (err) return cb(404, { Error: 'User not found' });

      // remove hashedPassword from user object
      delete userData.hashedPassword;
      return cb(200, userData);
    });
    return undefined;
  });
  return undefined;
};

// _users put
// Required data: email
// Optional data: firstName, lastName, address1, address2, city, state, zipcode, password (at least one required)
handlers._users.put = (data, cb) => {
  const email = typeof data.payload.email === 'string'
    && data.payload.email.trim().length > 10
    && data.payload.email.indexOf('@') > 0
    ? data.payload.email.trim() : false;

  if (!email) return cb(400, { Error: 'Missing required field' });

  // check for optional fields
  const firstName = typeof data.payload.firstName === 'string'
    && data.payload.firstName.trim().length > 0
    ? data.payload.firstName.trim() : false;
  const lastName = typeof data.payload.lastName === 'string'
    && data.payload.lastName.trim().length > 0
    ? data.payload.lastName.trim() : false;
  const address1 = typeof data.payload.address1 === 'string'
    && data.payload.address1.trim().length > 0
    ? data.payload.address1.trim() : false;
  const address2 = typeof data.payload.address2 === 'string'
    ? data.payload.address2.trim() : ''; // because it's optional
  const city = typeof data.payload.city === 'string'
    && data.payload.city.trim().length > 0
    ? data.payload.city.trim() : false;  
  const state = typeof data.payload.state === 'string'
    && data.payload.state.trim().length === 2
    ? data.payload.state.trim().toUpperCase() : false; 
  const zipcode = typeof data.payload.zipcode === 'string'
    && data.payload.zipcode.trim().length > 0 // could be zip+4 so leave it a string
    ? data.payload.zipcode.trim() : false; 
  const password = typeof data.payload.password === 'string'
    && data.payload.password.trim().length > 0
    ? data.payload.password.trim() : false;
  if (!(firstName 
    || lastName
    || address1
    || city
    || state
    || zipcode 
    || password)) {
    return cb(400, { Error: 'Missing field(s) to update' });
  }

  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;

  // verify that the token is valid for this phone number
  helpers.verifyToken(token, email, (tokenIsValid) => {
    if (!tokenIsValid) return cb(403, { Error: 'Missing required token in header or token is invalid' });

    // lookup the user
    _data.read('users', email, (err, userData) => {
      if (err) return cb(400, { Error: 'The specified user does not exist' });

      // update the necessary fields
      if (firstName) userData.firstName = firstName;
      if (lastName) userData.lastName = lastName;
      if (address1) userData.address1 = address1;
      if (address2) userData.address2 = address2;
      if (city) userData.city = city;
      if (state) userData.state = state;
      if (zipcode) userData.zipcode = zipcode;
      if (password) userData.hashedPassword = helpers.hash(password);

      // store the new updates
      _data.update('users', email, userData, (uerr) => {
        if (uerr) {
          console.log(err);
          return cb(500, { Error: 'Could not update the user' });
        }
        return cb(200);
      });
      return undefined;
    });
    return undefined;
  });
  return undefined;
};

// _users delete
// Required data: email
// Optional data: none
handlers._users.delete = (data, cb) => {
  const email = typeof data.query.email === 'string'
    && data.query.email.trim().length > 10
    && data.query.email.indexOf('@') > 0
    ? data.query.email.trim() : false;

  if (!email) return cb(400, { Error: 'Missing required field' });

  // get the token from the header
  const token = typeof data.headers.token === 'string' ? data.headers.token : false;

  // verify that the token is valid for this phone number
  helpers.verifyToken(token, email, (tokenIsValid) => {
    if (!tokenIsValid) return cb(403, { Error: 'Missing required token in header or token is invalid' });
  
    _data.read('users', email, (rerr) => { // we'll leave this here just in case. Don't actually need it...
      if (rerr) return cb(404, { Error: 'Specified user not found' });

      _data.delete('users', email, (derr) => {
        if (derr) return cb(404, { Error: 'User not found' });
        
        // if there's any litter left over from this users, here's where we'd clean it up.

        return undefined;
      });
      return undefined;
    });
    return undefined;
  });
  return undefined;
};

export default handlers;
