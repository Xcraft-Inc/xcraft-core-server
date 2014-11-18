#!/usr/bin/env node
'use strict';

var boot   = require ('./boot.js');
var xLog = require ('xcraft-core-log') ('bus-server');
xLog.verbosity (process.env.XCRAFT_LOG ? parseInt (process.env.XCRAFT_LOG) : 2);


var server = function (err) {
  if (err) {
    xLog.err (err);
  }

  var commander = boot.bus.getCommander ();

  commander.registerShutdownHandler (function () {
    boot.busClient.events.send ('disconnected');
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

boot.start (server);
