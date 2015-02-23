'use strict';

var moduleName = 'xcraft';

var path   = require ('path');
var daemon = require ('xcraft-core-daemon') (moduleName, path.join (__dirname, 'lib/server.js'), true);

module.exports = daemon;
