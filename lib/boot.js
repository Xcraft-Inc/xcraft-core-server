'use strict';

var moduleName = 'server/boot';

var path = require ('path');

var xBus         = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient').initGlobal ();
var xLog         = require ('xcraft-core-log') (moduleName, true);
var xcraftConfig = require ('xcraft-core-etc') ().load ('xcraft');


xBus.getEmitter.on ('stop', function () {
  xLog.verb ('Bus stop event received');
});

exports.start = function (callback) {
  var xEnv  = require ('xcraft-core-env');

  xEnv.devrootUpdate ();

  /* Prefer english (C locale).
   * For Windows OS it's more difficult because it's the .mui files in System32
   * and it can not be changed on the fly with the environnment.
   */
  process.env.LOCALE = 'C';

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
