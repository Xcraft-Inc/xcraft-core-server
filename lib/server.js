'use strict';

const moduleName = 'server';

const boot = require('./boot.js');
const xLog = require('xcraft-core-log')(moduleName, null);
const eventStore = require('xcraft-core-eventstore');

xLog.setVerbosity(
  process.env.XCRAFT_LOG ? parseInt(process.env.XCRAFT_LOG) : 0
);

const generateMotd = function(orcName) {
  const busConfig = require('xcraft-core-etc')().load('xcraft-core-bus');

  const motd = require('./motd.js');

  return {
    server: busConfig.host,
    commandsPort: busConfig.commanderPort,
    eventsPort: busConfig.notifierPort,
    orcName: orcName,
    motd: motd.get(),
  };
};

const startBusServices = function(err) {
  if (err) {
    xLog.err(err);
  }

  let heartbeatPulsor = null;
  const commander = boot.bus.getCommander();

  commander.registerErrorHandler(function(msg) {
    xLog.err(msg.desc);
    boot.busClient.events.send(
      `${msg.data.orcName}::${msg.cmd}.${msg.data.id}.error`,
      msg.desc
    );
  });

  commander.registerShutdownHandler(function() {
    /* Shutdown only in case of non-orc (server) */
    if (boot.busClient.getOrcName() === null) {
      xLog.verb('shutdown...');
      clearInterval(heartbeatPulsor);
      boot.stop();
    }
  });

  commander.registerAutoconnectHandler(function(msg) {
    const registry = commander.getFullRegistry();
    const orcName = boot.bus.generateOrcName();
    const connectedMsg = {
      token: boot.busClient.getToken(),
      orcName: orcName,
      cmdRegistry: registry,
      isLoaded: boot.bus.loaded,
    };
    const autoConnectToken = msg.data;

    boot.busClient.events.send(
      autoConnectToken + '::autoconnect.finished',
      connectedMsg
    );
  });

  commander.registerDisconnectHandler(function(msg) {
    boot.busClient.events.send(`${msg.orcName}::disconnect.finished`);
  });

  commander.registerMotdHandler(function(msg) {
    boot.busClient.events.send(
      `${msg.orcName}::motd`,
      generateMotd(msg.orcName)
    );
    boot.busClient.events.send(`${msg.orcName}::motd.finished`);
  });

  commander.registerBroadcastHandler(function(msg) {
    msg.data.msg._xcraftBroadcasted = true;
    boot.busClient.events.send(msg.data.topic, msg.data.msg);
  });

  heartbeatPulsor = setInterval(function() {
    boot.busClient.events.send('greathall::heartbeat');
  }, 500);
};

const server = function() {
  /* FIXME: Ensure not loading eventstore twice */
  const store = eventStore.getInstance();
  if (store) {
    eventStore.getInstance().use(function(err) {
      startBusServices(err);
    });
  } else {
    startBusServices();
  }
};

module.exports = callback =>
  boot.start(err => {
    server();
    callback(err);
  });

process.on('SIGINT', () => {
  boot.busClient.command.send('shutdown');
});
