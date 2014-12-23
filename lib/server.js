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

  var commander = boot.bus.getCommander ();
  boot.busClient.subscriptions.on ('message', function (topic, msg) {
    if (msg) {
      xLog.verb ('try to persist: ' + topic + ':' + msg);
      eventStore.persist (topic, msg);
    }
  });

  commander.registerShutdownHandler (function () {
    boot.busClient.events.send ('disconnected');
    eventStore.persist ('disconnected', {token: boot.busClient.getToken()});
    xLog.verb ('shutdown...');
    boot.stop ();
  });

  commander.registerAutoconnectHandler (function () {
    var registry  = commander.getCommandsRegistry ();
    var connectedMsg = {
      token       : boot.busClient.getToken(),
      cmdRegistry : registry
    };

    boot.busClient.events.send ('connected', connectedMsg);
  });
};

var server = function (err) {
  if (err) {
    xLog.err (err);
  }
  eventStore.getInstance ().use (function (err) {
    startBusServices (err);
  });
};

boot.start (server);
