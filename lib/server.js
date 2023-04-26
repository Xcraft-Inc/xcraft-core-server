'use strict';

const moduleName = 'server';

const boot = require('./boot.js');
const xLog = require('xcraft-core-log')(moduleName, null);
const {helpers} = require('xcraft-core-transport');

const {busClient} = boot;

xLog.setVerbosity(
  process.env.XCRAFT_LOG ? parseInt(process.env.XCRAFT_LOG) : 0
);

if (process.env.XCRAFT_LOG_MODS) {
  const moduleNames = process.env.XCRAFT_LOG_MODS.split(',');
  require('xcraft-core-log').setModuleNames(moduleNames);
}

const generateMotd = function (orcName) {
  const busConfig = require('xcraft-core-etc')().load('xcraft-core-bus');

  const motd = require('./motd.js');

  return {
    server: busConfig.host,
    commandsPort: busConfig.commanderPort,
    eventsPort: busConfig.notifierPort,
    timeout: busConfig.timeout,
    orcName: orcName,
    motd: motd.get(),
  };
};

const startBusServices = function (err) {
  if (err) {
    xLog.err(err);
  }

  let heartbeatPulsor = null;
  const commander = boot.bus.getCommander();

  commander.registerErrorHandler(function (msg) {
    xLog.warn(msg.desc);
    busClient.events.send(
      `${msg.data.orcName}::${msg.cmd}.${msg.data.id}.error`,
      msg.desc
    );
  });

  commander.registerShutdownHandler(function () {
    /* Shutdown only in case of non-orc (server) */
    if (busClient.getOrcName() === null) {
      busClient.events.send('greathall::shutdown');

      /* FIXME: use the dynamic discovering */
      const modules = [
        'xcraft-core-goblin',
        'xcraft-contrib-pacman',
        'goblin-repositor',
      ];
      for (const mod of modules) {
        try {
          const handle = require(mod);
          if (handle) {
            handle.dispose();
          }
        } catch (ex) {
          if (ex.code !== 'MODULE_NOT_FOUND') {
            throw ex;
          }
        }
      }

      xLog.verb('shutdown...');
      clearInterval(heartbeatPulsor);
      boot.stop();
    }
  });

  commander.registerAutoconnectHandler(function (msg) {
    const {Router} = require('xcraft-core-transport');

    const registry = commander.getFullRegistry();
    const orcName = boot.bus.generateOrcName();
    const connectedMsg = {
      token: busClient.getToken(),
      orcName: orcName,
      cmdRegistry: registry,
      isLoaded: boot.bus.loaded,
    };
    const {autoConnectToken} = msg.data;
    Router.moveRoute(autoConnectToken, orcName);

    busClient.events.send(
      autoConnectToken + '::autoconnect.finished',
      connectedMsg
    );
  });

  commander.registerDisconnectHandler(function (msg) {
    busClient.events.send(`${msg.orcName}::disconnect.finished`);
  });

  commander.registerMotdHandler(function (msg) {
    busClient.events.send(`${msg.orcName}::motd`, generateMotd(msg.orcName));
    busClient.events.send(`${msg.orcName}::motd.finished`);
  });

  commander.registerBroadcastHandler(function (msg) {
    // Restore transported data
    const broadcastedMsg = helpers.fromXcraftJSON(msg.data.msg)[0];

    const _msg = broadcastedMsg._xcraftRawMessage
      ? broadcastedMsg._xcraftRawMessage
      : broadcastedMsg;

    _msg._xcraftBroadcasted = true;

    if (_msg.forwarding) {
      _msg.router = _msg.forwarding.router;
      delete _msg.forwarding;
    }

    busClient.events.send(msg.data.topic, _msg);
  });

  const sendHeartbeat = () => {
    try {
      busClient.events.heartbeat();
    } catch (ex) {
      xLog.err(
        'error when trying to send heartbeat: %s',
        ex.stack || ex.message || ex
      );
    }
  };

  setTimeout(sendHeartbeat, 0);
  heartbeatPulsor = setInterval(sendHeartbeat, 500);
};

module.exports = (acceptIncoming) => (callback) =>
  boot.start((err) => {
    startBusServices();
    if (acceptIncoming) {
      boot.bus.acceptIncoming();
    }
    callback(err);
  });

process.on('SIGINT', () => {
  busClient.command.send('shutdown');
});

process.on('SIGTERM', () => {
  setTimeout(() => {
    xLog.err('Force shutdown because it takes too much time (more than 10s)');
    if (process.exitCode === 0) {
      process.exitCode = 10;
    }
    process.exit();
  }, 10000).unref();
  busClient.command.send('shutdown');
});
