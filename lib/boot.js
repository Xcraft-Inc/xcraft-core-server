'use strict';

var moduleName = 'server/boot';

var path = require ('path');

var xBus         = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient').initGlobal ();
var xLog         = require ('xcraft-core-log') (moduleName, true);
const serverConfig = require ('xcraft-core-etc') ().load ('xcraft-core-server');


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
  process.env.LANG = 'C';

  xLog.verb ('Xcraft environment ready');

  xBus.getEmitter.on ('ready', function () {
    /* Autoconnect is not possible at this point: heartbeat is not sent! */
    busClient.connect (xBus.getToken (), callback);
  });

  var commandHandlers = [];
  var xFs = require ('xcraft-core-fs');

  const dirArray = module.filename.split (path.sep);
  const pos = dirArray.lastIndexOf ('node_modules');
  const nodeModulesRoot = path.resolve (__dirname, dirArray.slice (0, pos + 1).join (path.sep));

  const modDirs = [{
    dir: nodeModulesRoot,
    filter: /^xcraft-(core|contrib).*/
  }];

  if (serverConfig.userModulesPath.length) {
    modDirs.push ({
      dir: serverConfig.userModulesPath,
      filter: serverConfig.userModulesFilter.length ? new RegExp (serverConfig.userModulesFilter) : null
    });
  }

  modDirs.forEach ((mod) => {
    xFs.ls (mod.dir, mod.filter).forEach (function (item) {
      commandHandlers.push ({
        path: path.dirname (require.resolve (item)),
        pattern: /.*\.js$/
      });
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
