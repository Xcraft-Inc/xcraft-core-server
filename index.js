'use strict';

exports.fork = function (callbackDone, callbackStdout, callbackStderr) {
  var path     = require ('path');
  var xProcess = require ('xcraft-core-process');

  xProcess.fork (path.join (__dirname, './lib/server.js'),
                 [], {silent: true}, callbackDone, callbackStdout, callbackStderr);
};
