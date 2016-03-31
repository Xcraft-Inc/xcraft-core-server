'use strict';

/**
 * Retrieve the inquirer definition for xcraft-core-server
 */
module.exports = [{
  type: 'input',
  name: 'userModulesPath',
  message: 'user modules path',
  default: ''
}, {
  type: 'input',
  name: 'userModulesFilter',
  message: 'user modules path filter',
  default: ''
}];
