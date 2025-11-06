'use strict';

const {syncPackagesSymlinks} = require('./lib/utils.js');

const moduleName = 'server';

exports.runAsDaemon = (options) => {
  const path = require('path');
  const Daemon = require('xcraft-core-daemon');

  return new Daemon(
    moduleName,
    path.join(__dirname, 'bin/server'),
    options,
    options.logs,
    options.response
  );
};

exports.runAsLib = () => {
  return {
    start: require('./lib/server.js')(false),
  };
};

exports.syncPackagesSymlinks = syncPackagesSymlinks;
