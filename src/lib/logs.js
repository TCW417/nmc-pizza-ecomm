//
// a library for storing and rotating logs
//
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// container
const lib = {};

// base director for the logs folder
lib.baseDir = path.join(__dirname, '/../.logs');

// append a string to a file. Create file if it doesn't exist
lib.append = (logFileName, logString, cb) => {
  // open the file for appending
  fs.open(`${lib.baseDir}/${logFileName}.log`, 'a', (oerr, fd) => {
    if (oerr) return cb(`could not open file for appending: ${oerr}`);

    fs.appendFile(fd, `${logString}\n`, (aerr) => {
      if (aerr) return cb(`Error appending to file: ${aerr}`);

      fs.close(fd, (cerr) => {
        if (cerr) return cb(`Error closing file being appended: ${cerr}`);
        return cb(false); // success
      });
      return undefined;
    });
    return undefined;
  });
};

// list all the logs and optionally include the compressed logs as well
lib.list = (includeCompressedLogs, cb) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (err || (data && data.length === 0)) return cb(err, data);

    const trimmedFileNames = [];
    data.forEach((fn) => {
      // add the .log files
      if (fn.indexOf('.log') > -1) {
        trimmedFileNames.push(fn.replace('.log', ''));
      }

      // add the .gz files if requested
      if (includeCompressedLogs && fn.indexOf('.gz.b64') > -1) {
        trimmedFileNames.push(fn.replace('.gz.b64', ''));
      }
    });
    return cb(false, trimmedFileNames);
  });
};

// compress the contents of one .log file into a .gz.b64 file
// within the same directory
lib.compress = (logId, newFileId, cb) => {
  const sourceFile = `${logId}.log`;
  const destFile = `${newFileId}.gz.b64`;

  // read the source file
  fs.readFile(`${lib.baseDir}/${sourceFile}`, 'utf8', (rerr, inputStr) => {
    if (rerr || !inputStr) return cb(rerr);

    // compress the data using gzip
    zlib.gzip(inputStr, (err, buffer) => {
      if (err || !buffer) return cb(err);

      // send the compressed data to destFile
      fs.open(`${lib.baseDir}/${destFile}`, 'wx', (oerr, fd) => {
        if (oerr || !fd) return cb(oerr);

        // write to destFile
        fs.writeFile(fd, buffer.toString('base64'), (werr) => {
          if (werr) return cb(werr);

          // close the file
          fs.close(fd, (clerr) => {
            if (clerr) return cb(clerr);
            return cb(false);
          });
          return undefined;
        });
        return undefined;
      });
      return undefined;
    });
    return undefined;
  });
};

// decompress the contents of a .gz.b64 file into a string variable
lib.decompress = (fileId, cb) => {
  const fileName = `${fileId}.gz.b64`;
  fs.readFile(`${lib.basedir}/${fileName}`, 'utf8', (rerr, str) => {
    if (rerr || !str) return cb(rerr);

    // decomprress the data
    const inputBuffer = Buffer.from(str, 'base64');
    zlib.unzip(inputBuffer, (uerr, outputBuffer) => {
      if (uerr || !outputBuffer) return cb(uerr);

      const outStr = outputBuffer.toString();
      return cb(false, outStr);
    });
    return undefined;
  });
};

// truncate a lof file
lib.truncate = (logId, cb) => {
  fs.truncate(`${lib.baseDir}/${logId}.log`, 0, (terr) => {
    if (!terr) return cb(false);
    return cb(terr);
  });
};

export default lib;
