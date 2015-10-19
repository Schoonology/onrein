'use strict'

var path = require('path')
var util = require('util')
var Promise = require('bluebird')
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
 * Returns a hash of `obj` suitable for change detection.
 */
function hash(obj) {
  return JSON.stringify(obj)
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
  var deviceStateHash = {}

  return WinkClient
    .login(manifest.account)
    .then(function (client) {
      process.stdout.write('Starting...\n')

      return (function tick() {
        var now = Date.now()
        var changes = {}
        var promise

        curves.forEach(function (curve) {
          curveData[curve.key] = curve(now)
        })

        devices.forEach(function (device) {
          var newState = device(curveData)
          var newHash = hash(newState)

          if (newHash !== deviceStateHash[device.key]) {
            deviceState[device.key] = newState
            deviceStateHash[device.key] = newHash
            changes[device.key] = newState
          }
        })

        if (Object.keys(changes).length === 0) {
          promise = Promise.resolve()
        } else {
          process.stdout.write(util.format('Setting device state to: %j\n', changes))
          promise = client.setDeviceState(changes)
            .catch(function (err) {
              process.stderr.write(util.format('Error during setDeviceState: %s\n', err.message || err))
            })
            .then(function () {
              process.stdout.write('Accepted.\n')
            })
        }

        return promise
          .delay(5000)
          .then(tick)
      }())
    })
}

/*!
 * Export `start`.
 */
module.exports = start
