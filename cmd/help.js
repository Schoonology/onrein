'use strict'

var fs = require('fs')
var path = require('path')

function help(argv, options, loader) {
  process.stdout.write(loader.getUsage('help'))
}

module.exports = help
