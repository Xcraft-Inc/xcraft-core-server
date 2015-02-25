'use strict';

var moduleName = 'xcraft';

var path   = require ('path');
var daemon = require ('xcraft-core-daemon');

module.exports = function (detached) {
  return daemon (moduleName, path.join (__dirname, 'lib/server.js'), detached);
};
