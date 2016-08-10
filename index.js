'use strict';

const moduleName = 'server';

exports.runAsDaemon = (options) => {
  const path   = require ('path');
  const daemon = require ('xcraft-core-daemon');

  return daemon (
    moduleName,
    path.join (__dirname, 'bin/server'),
    options.detached,
    options.logs,
    options.response
  );
};

exports.runAsLib = () => {
  return {
    start: require ('./lib/server.js')
  };
};
