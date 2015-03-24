#!/usr/bin/env node
'use strict';

var boot           = require ('./boot.js');
var xLog           = require ('xcraft-core-log') ('bus-server');
var eventStore     = require ('xcraft-core-eventstore');
var busConfig      = require ('xcraft-core-etc').load ('xcraft-core-bus');

var namespaceServer = busConfig.namespaceServer;

xLog.verbosity (process.env.XCRAFT_LOG ? parseInt (process.env.XCRAFT_LOG) : 2);

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

  commander.registerAutoconnectHandler (function () {
    var registry  = commander.getCommandsRegistry ();
    var orcName   = boot.bus.generateOrcName ();
    var connectedMsg = {
      token:       boot.busClient.getToken (),
      orcName:     orcName,
      cmdRegistry: registry
    };

    boot.busClient.events.send (namespaceServer + '::autoconnect.finished', connectedMsg);
  });

  commander.registerDisconnectHandler (function () {
    boot.busClient.events.send ('disconnect.finished');
  });

  heartbeatPulsor = setInterval (function () {
    boot.busClient.events.send (namespaceServer + '::heartbeat');
  }, 500);
};

var server = function (err) {
  if (err) {
    xLog.err (err);
  }
  /* FIXME: Ensure not loading eventstore twice */
  eventStore.getInstance ().use (function (err) {
    startBusServices (err);
  });
};

boot.start (server);
