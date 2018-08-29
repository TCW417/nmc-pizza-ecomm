//
// this file interfaces to our .data store
//

import fs from 'fs';
import path from 'path';
import helpers from './helpers';

// module container
const lib = {};

// base director for the data folder
lib.baseDir = path.join(__dirname, '/../.data');

// create new data file
lib.create = (dir, file, data, cb) => {
  // open the file for writing
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'wx', (oerr, fd) => {
    if (oerr) return cb(`Could not create file. It may already exist: ${oerr}`);

    // convert data to string
    const stringData = JSON.stringify(data);

    // write to the file and close it
    return fs.writeFile(fd, stringData, (werr) => {
      if (werr) cb(`Error writing to new file: ${werr}`);

      return fs.close(fd, (cerr) => {
        if (cerr) cb(`Error closing new file: ${cerr}`);

        return cb(false); 
      });       
    });    
  });
};

// read data from a file
lib.read = (dir, file, cb) => {
  return fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, 'utf8', (err, data) => {
    if (!err && data) return cb(null, helpers.jsonParse(data));
    return cb(err, null);
  });
};

// update existing file with new data
lib.update = (dir, file, data, cb) => {
  // open the file for writing
  return fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'r+', (oerr, fd) => {
    if (oerr) return cb(`Could not open file for updating: ${oerr}`);

    const stringData = JSON.stringify(data);

    // trucate file
    return fs.ftruncate(fd, (terr) => {
      if (terr) return cb(`Could not truncate file: ${terr}`);

      return fs.writeFile(fd, stringData, (werr) => {
        if (werr) return cb(`Could not write to updated file: ${werr}`);

        return fs.close(fd, (cerr) => {
          if (cerr) return cb(`Could not close updated file: ${cerr}`);

          return cb(false);
        });
      });
    });
  });
};

lib.exists = (dir, file) => {
  return fs.existsSync(`${lib.baseDir}/${dir}/${file}.json`);
};

lib.delete = (dir, file, cb) => {
  // unlink file 
  fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, (err) => {
    if (err) return cb(`Could not delete file: ${err}`);
    return cb(false);
  });
};

// list all the items in a directory
lib.list = (dir, cb) => {
  fs.readdir(`${lib.baseDir}/${dir}/`, (err, data) => {
    if (err) return cb(err, data);

    const trimmedFileNames = [];
    if (data.length > 0) {
      data.forEach((f) => {
        trimmedFileNames.push(f.replace('.json', ''));
      });
    }
    return cb(false, trimmedFileNames);
  });
  return undefined;
};

export default lib;
