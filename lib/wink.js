/**
 * TODO: Description.
 */
var util = require('util')
var Promise = require('bluebird')
var ProxyClient = require('proxy-client')

/**
 * Creates a new instance of WinkClient with the provided `options`.
 *
 * @param {Object} options
 */
function WinkClient(options) {
  if (!(this instanceof WinkClient)) {
    return new WinkClient(options)
  }

  options = options || {}

  ProxyClient.call(this, options)

  this.rootUrl = options.rootUrl || 'https://winkapi.quirky.com'
  this.timeout = options.timeout || 20000
}
util.inherits(WinkClient, ProxyClient)

/**
 * Returns a Promise to be resolved with a child WinkClient with proper
 * authentication against the Wink API.
 */
WinkClient.login = function login(account) {
  // TODO(schoon) - Options.
  // TODO(schoon) - Refresh auth.
  var parent = new WinkClient()

  return parent
    .post('/oauth2/token')
    .send({
      client_id: account.consumer.key,
      client_secret: account.consumer.secret,
      username: account.username,
      password: account.password,
      grant_type: 'password'
    })
    .end()
    .then(function (response) {
      if (response.statusCode !== 200) {
        throw new Error(util.format('Failed to log in with %s: %j', response.statusCode, response.body))
      }

      return new WinkClient({
        rootUrl: parent.rootUrl,
        timeout: parent.timeout,
        headers: {
          Authorization: 'Bearer ' + response.body.access_token
        }
      })
    })
}

/**
 * Returns a Promies to be resolved with all the account's devices' status
 * as an Object.
 */
WinkClient.prototype.getDevices = function getDevices() {
  return this
    .get('/users/me/wink_devices')
    .end()
    .then(function (response) {
      var devices = {}

      response.body.data.forEach(function (device) {
        var type
        var id

        Object
          .keys(device)
          .forEach(function (key) {
            if (key.slice(-3) === '_id') {
              if (['manufacturer_device_id', 'upc_id', 'gang_id', 'local_id', 'linked_service_id'].indexOf(key) !== -1) {
                return
              }

              if (key === 'hub_id' && type) {
                return
              }

              type = key.slice(0, -3)
              id = device[key]
            }
          })

        Object
          .keys(device.last_reading)
          .forEach(function (key) {
            if (key.slice(-11) === '_changed_at') {
              delete device.last_reading[key]
            } else if (key.slice(-11) === '_updated_at') {
              delete device.last_reading[key]
            }
          })

        devices[type + 's/' + id] = device.last_reading
      })

      return devices
    })
}

/**
 * Returns a Promies to be resolved once all devices in `devices` have their
 * `desired_state` set appropriately.
 */
WinkClient.prototype.setDeviceState = function setDeviceState(devices) {
  var self = this

  return Promise.props(Object.keys(devices)
    .reduce(function (obj, key) {
      obj[key] = self.put('/' + key)
        .send({
          desired_state: devices[key]
        })
        .end()

      return obj
    }, {})
  )
}

/*!
 * Export `WinkClient`.
 */
module.exports = WinkClient
