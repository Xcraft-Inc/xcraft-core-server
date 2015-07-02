'use strict';

var moduleName = 'server/boot';

var path = require ('path');

var xBus         = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient').initGlobal ();
var xLog         = require ('xcraft-core-log') (moduleName, true);
var xcraftConfig = require ('xcraft-core-etc').load ('xcraft');


xBus.getEmitter.on ('stop', function () {
  xLog.verb ('Bus stop event received');
});

exports.start = function (callback) {
  var xPath = require ('xcraft-core-path');

  xPath.devrootUpdate ();

  /* Unix stuff for the program loader.
   * The libraries in the usr/lib toolchain directory must be available for the
   * program loader. Otherwise non-static binaries can fail.
   */
  var ldPath = path.resolve ('./usr/lib');
  if (process.env.LD_LIBRARY_PATH) {
    process.env.LD_LIBRARY_PATH += path.delimiter + ldPath;
  } else {
    process.env.LD_LIBRARY_PATH = ldPath;
  }

  xLog.verb ('Xcraft environment ready');

  xBus.getEmitter.on ('ready', function () {
    /* Autoconnect is not possible at this point: heartbeat is not sent! */
    busClient.connect (xBus.getToken (), callback);
  });

  var commandHandlers = [];
  var xFs = require ('xcraft-core-fs');
  xFs.ls (xcraftConfig.nodeModulesRoot, /^xcraft-(core|contrib).*/).forEach (function (item) {
    commandHandlers.push ({
      path: path.dirname (require.resolve (item)),
      pattern: /.*\.js$/
    });
  });

  xBus.boot (commandHandlers);
};

exports.stop = function () {
  busClient.stop (function (err) { /* jshint ignore:line */
    xBus.stop ();
  });
};

exports.busClient = busClient;
exports.bus = xBus;
