//
// helper functions for various tasks
//
import crypto from 'crypto';
import config from '../config';
import _data from './data';

const helpers = {};

// create a SHA256 hash
helpers.hash = (str) => {
  if (typeof str === 'string' && str.length > 0) {
    return crypto.createHmac('sha256', config.HASH_SECRET).update(str).digest('hex');
  }
  return false;
};

// parse json to obj without throwing error
helpers.jsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return false;
  }
};

// create a string of random characters of given length
helpers.createRandomString = (len) => {
  const strLen = typeof len === 'number' && len > 0 ? len : false;
  if (!strLen) return false;

  const possibleChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // start string as empty
  let str = '';
  for (let i = 0; i < strLen; i++) {
    // get a random char from possibleChars and append to str
    const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    str += randomChar;
  }

  return str;
};

// verify if a token id is valid for the current user
helpers.verifyToken = (id, email, cb) => {
  // lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (err) return cb(false);

    // check that the token is for the given user and
    // has not expired
    if (email === tokenData.email && tokenData.expires > Date.now()) {
      return cb(true);
    }
    return cb(false);
  });
};

export default helpers;
