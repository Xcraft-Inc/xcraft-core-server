'use strict';

var moduleName = 'boot';

var path = require ('path');

var xBus         = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient');
var xLog         = require ('xcraft-core-log') (moduleName);
var xcraftConfig = require ('xcraft-core-etc').load ('xcraft');

xBus.getEmitter.on ('stop', function () {
  xLog.verb ('Bus stop event received');
});

exports.start = function (callback) {
  var xPath = require ('xcraft-core-path');

  xPath.xcraftUpdate ();
  xPath.devrootUpdate ();
  xLog.verb ('Xcraft environment ready');

  xBus.getEmitter.on ('ready', function () {
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
