'use strict';

const moduleName = 'server/boot';

const fs = require ('fs');
const path = require ('path');

const xBus = require ('xcraft-core-bus');
const busClient = require ('xcraft-core-busclient').initGlobal ();
const xLog = require ('xcraft-core-log') (moduleName, null);
const serverConfig = require ('xcraft-core-etc') ().load ('xcraft-core-server');

xBus.on ('stop', function () {
  xLog.verb ('Bus stop event received');

  /* Node.js quits when all events are unsubscribed but it's not the case with
   * electron where it's necessary to call app.quit() explicitly.
   * FIXME: Maybe it's not the best place for this call but it should not
   *        matter.
   */
  if (process.versions.electron) {
    const {app} = require ('electron');
    app.quit ();
  }
});

exports.start = function (callback) {
  const xEnv = require ('xcraft-core-env');

  xEnv.devrootUpdate ();

  /* Prefer english (C locale).
   * For Windows OS it's more difficult because it's the .mui files in System32
   * and it can not be changed on the fly with the environnment.
   */
  process.env.LANG = 'C';

  xLog.verb ('Xcraft environment ready');

  xBus.on ('ready', loadModules => {
    /* Autoconnect is not possible at this point: heartbeat is not sent! */
    busClient.connect (xBus.getToken (), err => {
      if (err) {
        callback (err);
        return;
      }

      /* We can load the modules because we are connected. Then it's possible
       * to start the _postload commands.
       */
      loadModules (busClient, callback);
    });
  });

  const commandHandlers = [];
  const xFs = require ('xcraft-core-fs');

  const dirArray = module.filename.split (path.sep);
  const pos = dirArray.lastIndexOf ('node_modules');
  const nodeModulesRoot = path.resolve (
    __dirname,
    dirArray.slice (0, pos + 1).join (path.sep)
  );

  const modDirs = [
    {
      dir: nodeModulesRoot,
      filter: /^xcraft-(core|contrib).*/,
    },
  ];

  if (serverConfig.userModulesPath.length) {
    modDirs.push ({
      dir: serverConfig.userModulesPath,
      filter: serverConfig.userModulesFilter.length
        ? new RegExp (serverConfig.userModulesFilter)
        : null,
    });
  }

  modDirs.forEach (mod => {
    xFs
      .ls (mod.dir, mod.filter)
      .filter (dir => {
        try {
          fs.statSync (path.join (mod.dir, dir, 'rc.json'));
        } catch (ex) {
          return false;
        }
        return true;
      })
      .map (item =>
        require
          .resolve (item)
          .replace (new RegExp (`(.*[/\\\\]${item})[/\\\\].*`), '$1')
      )
      .forEach (function (location) {
        commandHandlers.push ({
          path: location,
          pattern: /^[^.].*\.js$/,
        });
      });
  });

  xLog.verb ('List of discovered modules:');
  commandHandlers.forEach (cmd => xLog.verb (`-> ${cmd.path}`));

  try {
    xBus.boot (commandHandlers, err => {
      if (err) {
        callback (err);
      }
    });
  } catch (ex) {
    callback (ex);
  }
};

exports.stop = function () {
  busClient.stop (function (err) {
    if (err) {
      xLog.err (err);
    }

    xBus.stop ();
  });
};

exports.busClient = busClient;
exports.bus = xBus;
