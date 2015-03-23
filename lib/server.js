#!/usr/bin/env node
'use strict';

var boot           = require ('./boot.js');
var xLog           = require ('xcraft-core-log') ('bus-server');
var eventStore     = require ('xcraft-core-eventstore');

xLog.verbosity (process.env.XCRAFT_LOG ? parseInt (process.env.XCRAFT_LOG) : 2);

var startBusServices = function (err) {
  if (err) {
    xLog.err (err);
  }

  var heartbeatPulsor = null;
  var commander = boot.bus.getCommander ();

  boot.busClient.subscriptions.on ('message', function (topic, msg) {
    if (msg && topic !== 'heartbeat') {
      xLog.verb ('write: ' + topic + ':' + JSON.stringify (msg));
      eventStore.persist (topic, msg);
    }
  });

  commander.registerShutdownHandler (function () {
    boot.busClient.events.send ('disconnected');
    /* added manual persistance for this event, because it's catched too late */
    eventStore.persist ('disconnected', {token: boot.busClient.getToken ()});
    xLog.verb ('shutdown...');

    clearInterval (heartbeatPulsor);
    boot.stop ();
  });

  commander.registerAutoconnectHandler (function () {
    var registry  = commander.getCommandsRegistry ();
    var orcName   = boot.bus.generateOrcName ();
    var connectedMsg = {
      token:       boot.busClient.getToken (),
      orcName:     orcName,
      cmdRegistry: registry
    };

    boot.busClient.events.send ('connected', connectedMsg);
  });

  heartbeatPulsor = setInterval (function () {
    boot.busClient.events.send ('heartbeat');
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
