#!/usr/bin/env node
'use strict';

var moduleName = 'server';

var boot           = require ('./boot.js');
var xLog           = require ('xcraft-core-log') (moduleName, true);
var eventStore     = require ('xcraft-core-eventstore');

xLog.setVerbosity (process.env.XCRAFT_LOG ? parseInt (process.env.XCRAFT_LOG) : 0);


var generateMotd = function (orcName) {
  var busConfig = require ('xcraft-core-etc') ().load ('xcraft-core-bus');

  var motd = require ('./motd.js');

  return {
    server:       busConfig.host,
    commandsPort: busConfig.commanderPort,
    eventsPort:   busConfig.notifierPort,
    orcName:      orcName,
    motd:         motd.get ()
  };
};

var startBusServices = function (err) {
  if (err) {
    xLog.err (err);
  }

  var heartbeatPulsor = null;
  var commander = boot.bus.getCommander ();

  commander.registerShutdownHandler (function () {
    /* Shutdown only in case of non-orc (server) */
    if (boot.busClient.getOrcName () === null) {
      xLog.verb ('shutdown...');
      clearInterval (heartbeatPulsor);
      boot.stop ();
    }
  });

  commander.registerAutoconnectHandler (function (msg) {
    var registry  = commander.getCommandsRegistry ();
    var orcName   = boot.bus.generateOrcName ();
    var connectedMsg = {
      token:       boot.busClient.getToken (),
      orcName:     orcName,
      cmdRegistry: registry
    };
    var autoConnectToken = msg.data;

    boot.busClient.events.send (autoConnectToken + '::autoconnect.finished', connectedMsg);
  });

  commander.registerDisconnectHandler (function () {
    boot.busClient.events.send ('disconnect.finished');
  });

  commander.registerMotdHandler (function () {
    var orcName = boot.busClient.getStateWhich ();
    boot.busClient.events.send ('motd', generateMotd (orcName));
    boot.busClient.events.send ('motd.finished');
  });

  heartbeatPulsor = setInterval (function () {
    boot.busClient.events.send ('greathall::heartbeat');
  }, 500);
};

var server = function (err) {
  if (err) {
    xLog.err (err);
  }

  /* FIXME: Ensure not loading eventstore twice */
  var store = eventStore.getInstance ();
  if (store) {
    eventStore.getInstance ().use (function (err) {
      startBusServices (err);
    });
  } else {
    startBusServices ();
  }
};

boot.start (server);
