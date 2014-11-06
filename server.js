#!/usr/bin/env node
'use strict';

var boot   = require ('./boot.js');
var zogLog = require ('xcraft-core-log') ('bus-server');
zogLog.verbosity (process.env.XCRAFT_LOG ? parseInt (process.env.XCRAFT_LOG) : 2);


var server = function () {
  var commander = boot.bus.getCommander ();

  commander.registerShutdownHandler (function () {
    boot.busClient.events.send ('disconnected');
    zogLog.verb ('shutdown...');
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
