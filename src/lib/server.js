//
// this is the primary file for the api
//
import http from 'http';
import https from 'https';
import url from 'url';
import stringDecoder from 'string_decoder';
import fs from 'fs';
import util from 'util';

import config from '../config';
import userRoutes from '../routes/userRoutes';
import tokenRoutes from '../routes/tokenRoutes';
import menuRoutes from '../routes/menuRoutes';
import miscRoutes from '../routes/miscRoutes';
import helpers from './helpers';

const { StringDecoder } = stringDecoder;
const debug = util.debuglog('server');

// request router
const router = {
  ping: miscRoutes.ping,
  users: userRoutes.users,
  tokens: tokenRoutes.tokens,
  menu: menuRoutes.menu,
};

const unifiedServer = (req, res) => {
  // get the url and parse it including the query string
  const parsedUrl = url.parse(req.url, true);
  
  // get the path from the url
  const path = parsedUrl.pathname;
  
  // trim leading and trailing slashes
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
  // get the query string
  const { query } = parsedUrl;
  
  // get the http method requested
  const method = req.method.toLowerCase();
  
  // get request headers as an object
  const { headers } = req;

  // get the payload if there is one
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // choose the handler for this request. if one isn't
    // found use the notFound handler
    const chosenHandler = router[trimmedPath] ? router[trimmedPath] : miscRoutes.notFound;
    
    // construct the data object to pass to the handler
    const data = {
      trimmedPath,
      query,
      method,
      headers,
      payload: helpers.jsonParse(buffer),
    };

    // route the request to the chosen handler
    chosenHandler(data, (statusCode = 200, payload = {}) => {
      // convert payload object to sting
      const jsonString = JSON.stringify(payload);

      // return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(jsonString);

      // If the resposne is 200, log in green, otherwise red
      let logColor = '\x1b[32m%s\x1b[0m';
      if (statusCode !== 200) logColor = '\x1b[31m%s\x1b[0m';
      debug(logColor, `${method.toUpperCase()} /${trimmedPath} Status ${statusCode} Payload:\n${jsonString}`);
    });
  });
    
  debug(`${method} request received on path: ${trimmedPath} with query ${JSON.stringify(query)}`);
};

// create http server
const httpServer = http.createServer(unifiedServer);

// create https server
const httpsServerOptions = {
  key: fs.readFileSync(`${__dirname}/https/key.pem`),
  cert: fs.readFileSync(`${__dirname}/https/cert.pem`),
};

const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

const startServer = () => {
  httpServer.listen(config.HTTP_PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', `The ${config.ENV_NAME} server is listening on port ${config.HTTP_PORT}`);
  });
  httpsServer.listen(config.HTTPS_PORT, () => {
    console.log('\x1b[35m%s\x1b[0m', `The ${config.ENV_NAME} server is listening on port ${config.HTTPS_PORT}`);
  });
};

export default startServer;
