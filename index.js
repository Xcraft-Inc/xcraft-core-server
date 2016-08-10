'use strict';

var moduleName = 'server';

var path   = require ('path');
var daemon = require ('xcraft-core-daemon');

exports.runAsDaemon = (options) => {
  return daemon (
    moduleName,
    path.join (__dirname, 'bin/server'),
    options.detached,
    options.logs,
    options.response
  );
};

exports.runAsLib = () => {
  return {start: require ('./lib/server.js')};
};
