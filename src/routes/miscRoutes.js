//
// handlers for misc routes
//

const handlers = {};

// ping handler
handlers.ping = (data, cb) => {
  // call back with http status code 200
  cb(200);
};


// not found handler
handlers.notFound = (data, cb) => {
  cb(404);
};

export default handlers;
