'use strict';

/**
 * Retrieve the inquirer definition for xcraft-core-server
 */
module.exports = [
  {
    type: 'input',
    name: 'userModulesPath',
    message: 'user modules path',
    default: '',
  },
  {
    type: 'input',
    name: 'userModulesFilter',
    message: 'user modules path filter',
    default: '',
  },
  {
    type: 'input',
    name: 'userModulesBlacklist',
    message: 'user modules path blacklist',
    default: '',
  },
  {
    type: 'confirm',
    name: 'useDevroot',
    message: 'enable devroot (toolchain) environment support',
    default: true,
  },
  {
    type: 'checkbox',
    name: 'modules',
    message: 'restricted list of modules to load (empty for all)',
    choices: [],
    default: [],
  },
];
