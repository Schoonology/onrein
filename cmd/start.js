'use strict'

var path = require('path')
var thermostat = require('thermostat')
var traverse = require('traverse')
var WinkClient = require('../lib/wink')

/**
 * Compiles any "$EXPRESSION" template strings in `obj`, returning a function
 * that renders those strings from a single parameter, `curves`. The parameter
 * should contain the current state of all curves, represented as an Object.
 */
function compile(obj) {
  obj = traverse(obj).map(function (value) {
    if (this.isLeaf && String(value)[0] === '$') {
      this.update(new Function('curves', 'return ' + String(value).substr(1)))
    }
  })

  return function render(curves) {
    return traverse(obj).map(function (value) {
      if (typeof value === 'function') {
        this.update(value(curves))
      }
    })
  }
}

/**
 * Fulfills the `start` command. See README and `man/start` for more
 * information.
 */
function start(argv, options, loader) {
  var manifest = require(path.resolve(process.cwd(), argv[0]))
  var curves = Object.keys(manifest.curves)
    .map(function (key) {
      var curve = thermostat.createCurve(manifest.curves[key])
      curve.key = key
      return curve
    })
  var devices = Object.keys(manifest.devices)
    .map(function (key) {
      var compiled = compile(manifest.devices[key])
      compiled.key = key
      return compiled
    })
  var curveData = {}
  var deviceState = {}

  return WinkClient
    .login(manifest.account)
    .then(function (client) {
      return (function tick() {
        var now = Date.now()

        curves.forEach(function (curve) {
          curveData[curve.key] = curve(now)
        })

        devices.forEach(function (device) {
          deviceState[device.key] = device(curveData)
        })

        return client.setDeviceState(deviceState)
          .catch(function (err) {
            process.stderr.write('Error during setDeviceState: %s', err.message || err)
          })
          .delay(5000)
          .then(tick)
      }())
    })
}

/*!
 * Export `start`.
 */
module.exports = start
