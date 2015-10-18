'use strict'

var fs = require('fs')
var path = require('path')
var WinkClient = require('../lib/wink')

/**
 * Fulfills the `status` command. See README and `man/status` for more
 * information.
 */
function status(argv, options, loader) {
  var manifest = require(path.resolve(process.cwd(), argv[0]))

  return WinkClient
    .login(manifest.account)
    .then(function (client) {
      return client.getDevices()
    })
}

/*!
 * Export `status`.
 */
module.exports = status
