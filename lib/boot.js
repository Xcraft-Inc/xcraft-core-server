'use strict';

const moduleName = 'server/boot';

const path = require('path');
const fs = require('fs');

const xBus = require('xcraft-core-bus');
const busClient = require('xcraft-core-busclient').initGlobal();
const xLog = require('xcraft-core-log')(moduleName, null);
const serverConfig = require('xcraft-core-etc')().load('xcraft-core-server');
const hordeConfig = require('xcraft-core-etc')().load('xcraft-core-horde');

xBus.on('stop', function () {
  xLog.verb('Bus stop event received');

  /* Node.js quits when all events are unsubscribed but it's not the case with
   * electron where it's necessary to call app.quit() explicitly.
   * FIXME: Maybe it's not the best place for this call but it should not
   *        matter.
   */
  if (process.versions.electron && process.env.ELECTRON_RUN_AS_NODE !== '1') {
    const {app} = require('electron');
    app.quit();
  }
});

exports.start = function (callback) {
  const xUtils = require('xcraft-core-utils');

  if (serverConfig.useDevroot) {
    const xEnv = require('xcraft-core-env');
    xEnv.devrootUpdate();

    /* Prefer english (C locale).
     * For Windows OS it's more difficult because it's the .mui files in System32
     * and it can not be changed on the fly with the environnment.
     */
    process.env.LANGUAGE = 'en_US';
    process.env.LANG = `${process.env.LANGUAGE}.UTF-8`;
    process.env.LC_ALL = process.env.LANG;
  }

  xLog.verb('Xcraft environment ready');

  xBus.on('ready', (loadModules) => {
    /* Autoconnect is not possible at this point: heartbeat is not sent! */
    busClient.connect('ee', xBus.getToken(), (err) => {
      if (err) {
        callback(err);
        return;
      }

      /* We can load the modules because we are connected. Then it's possible
       * to start the _postload commands.
       */
      loadModules(busClient, callback);
    });
  });

  const commandHandlers = [];
  const xFs = require('xcraft-core-fs');

  let nodeModulesRoot = null;
  module.paths
    .filter((p) => !p.includes('xcraft-core-server'))
    .some((p) => {
      try {
        fs.statSync(p);
        nodeModulesRoot = p;
        return true;
      } catch (ex) {
        return false;
      }
    });

  if (!nodeModulesRoot) {
    throw new Error(
      'cannot found the node_modules directory, it seems that you are using a bad symlink'
    );
  }

  const modDirs = [
    {
      dir: nodeModulesRoot,
      filter: /^(goblin|xcraft-(core|contrib))-/,
    },
  ];

  if (serverConfig.userModulesFilter.length) {
    modDirs.push({
      dir: serverConfig.userModulesPath || nodeModulesRoot,
      filter: serverConfig.userModulesFilter.length
        ? new RegExp(serverConfig.userModulesFilter)
        : null,
    });
  }

  let blacklistReg = null;
  if (serverConfig.userModulesBlacklist.length) {
    blacklistReg = new RegExp(serverConfig.userModulesBlacklist);
  }

  let allModules = [];

  modDirs.forEach((mod) => {
    allModules = allModules.concat(
      xFs
        .ls(mod.dir, mod.filter)
        .filter((dir) => {
          if (!serverConfig.userModulesBlacklist.length) {
            return true;
          }
          return !dir.match(blacklistReg);
        })
        .map((dir) => {
          const defPath = path.join(mod.dir, dir, 'package.json');
          try {
            const def = xUtils.json.fromFile(defPath);
            return {def, dir};
          } catch (ex) {
            /* skip on errors */
          }
          return {def: null, dir};
        })
    );
  });

  const modules = {};

  const extract = (modulesList) => {
    allModules
      .filter(
        (item) =>
          !modulesList ||
          !modulesList.length ||
          modulesList.indexOf(item.def.name) !== -1
      )
      .filter(
        (item) =>
          item.def &&
          item.def.config &&
          item.def.config.xcraft &&
          item.def.config.xcraft.commands === true
      )
      .forEach((item) => {
        if (
          !modules[item.def.name] &&
          (!modulesList ||
            !modulesList.length ||
            modulesList.indexOf(item.def.name) !== -1)
        ) {
          modules[item.def.name] = item;
          let list = item.def.dependencies
            ? Object.keys(item.def.dependencies)
            : [];
          if (process.env.NODE_ENV === 'development') {
            if (item.def.devDependencies) {
              list = list.concat(Object.keys(item.def.devDependencies));
            }
          }
          if (list && list.length) {
            extract(list);
          }
        }
      });
  };

  let modulesList = ['xcraft-core-bus', ...serverConfig.modules];
  if (
    serverConfig.modules &&
    serverConfig.modules.length &&
    hordeConfig &&
    hordeConfig.hordes &&
    hordeConfig.hordes.length &&
    modulesList.indexOf('xcraft-core-horde') === -1
  ) {
    modulesList = modulesList.concat('xcraft-core-horde');
  } else if (serverConfig.modules.length === 0) {
    modulesList = null;
  }

  extract(modulesList);

  Object.keys(modules).forEach(function (name) {
    const {def} = modules[name];

    let moduleInfo;
    if (
      !serverConfig.userModulesPath ||
      !!name.match(/^(goblin|xcraft-(core|contrib))-/)
    ) {
      moduleInfo = xBus.getModuleInfo(name);
    } else {
      moduleInfo = xBus.getModuleInfo(name, serverConfig.userModulesPath);
    }

    commandHandlers.push({
      name,
      hot: !!def.config.xcraft.hot,
      version: def.version,
      ...moduleInfo,
    });
  });

  xLog.dbg(`List of discovered modules:`);
  commandHandlers
    .sort((c1, c2) => (c1.name > c2.name ? -1 : c2.name > c1.name ? 1 : 0))
    .map((cmd) => {
      xLog.dbg(`|- ${cmd.name} (v${cmd.version})`);
      xLog.verb(`|  ${cmd.path}`);
    });

  xBus.boot(commandHandlers, (err) => {
    if (err) {
      callback(err);
    }
    // The case where it's working is handled by the 'ready' event.
  });
};

exports.stop = function () {
  busClient.stop(function (err) {
    if (err) {
      xLog.err(err);
    }

    xBus.stop();
  });
};

exports.busClient = busClient;
exports.bus = xBus;
