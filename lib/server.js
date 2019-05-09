'use strict';

const moduleName = 'server';

const boot = require('./boot.js');
const xLog = require('xcraft-core-log')(moduleName, null);
const eventStore = require('xcraft-core-eventstore');
const {helpers} = require('xcraft-core-transport');

const {busClient} = boot;

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
    busClient.events.send(
      `${msg.data.orcName}::${msg.cmd}.${msg.data.id}.error`,
      msg.desc
    );
  });

  commander.registerShutdownHandler(function() {
    /* Shutdown only in case of non-orc (server) */
    if (busClient.getOrcName() === null) {
      xLog.verb('shutdown...');
      clearInterval(heartbeatPulsor);
      boot.stop();
    }
  });

  commander.registerAutoconnectHandler(function(msg) {
    const registry = commander.getFullRegistry();
    const orcName = boot.bus.generateOrcName();
    const connectedMsg = {
      token: busClient.getToken(),
      orcName: orcName,
      cmdRegistry: registry,
      isLoaded: boot.bus.loaded,
    };
    const autoConnectToken = msg.data;
    busClient.events.send(
      autoConnectToken + '::autoconnect.finished',
      connectedMsg
    );
  });

  commander.registerDisconnectHandler(function(msg) {
    busClient.events.send(`${msg.orcName}::disconnect.finished`);
  });

  commander.registerMotdHandler(function(msg) {
    busClient.events.send(`${msg.orcName}::motd`, generateMotd(msg.orcName));
    busClient.events.send(`${msg.orcName}::motd.finished`);
  });

  commander.registerBroadcastHandler(function(msg) {
    // Restore transported data
    const broadcastedMsg = helpers.fromXcraftJSON(msg.data.msg)[0];
    broadcastedMsg._xcraftBroadcasted = true;

    if (broadcastedMsg._xcraftRawMessage) {
      broadcastedMsg._xcraftRawMessage._xcraftBroadcasted = true;
    }

    busClient.events.send(
      msg.data.topic,
      broadcastedMsg._xcraftRawMessage
        ? broadcastedMsg._xcraftRawMessage
        : broadcastedMsg
    );
  });

  setTimeout(() => busClient.events.send('greathall::heartbeat'), 0);

  heartbeatPulsor = setInterval(function() {
    busClient.events.send('greathall::heartbeat');
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
  busClient.command.send('shutdown');
});
