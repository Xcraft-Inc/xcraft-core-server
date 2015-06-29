'use strict';

var moduleName = 'server';

var path   = require ('path');
var daemon = require ('xcraft-core-daemon');

module.exports = function (detached, logs) {
  return daemon (moduleName, path.join (__dirname, 'lib/server.js'), detached, logs);
};
