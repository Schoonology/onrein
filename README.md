# Onrein

A daemon lurking in your house, meddling with all your [Things](iot).

## Installation

```
npm install -g onrein
```

## Usage

Onrein comes with two components: a long-running service to manage Things, and
a CLI to manage the service and manage Things manually and immediately.

### Command: `start`

```
onrein start MANIFEST
```

Starts a long-running process, loading `MANIFEST` as a description of all the
Things Onrein should manage. The manifest file should be a JSON file or a Node
module exporting an Object with three keys, `account`, `curves`, and `devices`.
If provided, an `options` key will also be interpreted.

The `account` Object should provide four values required by the [Wink](wink)
API to authenticate Onrein for control over your Things:

- `consumer`: A pair of OAuth consumer credentials, `key` and `secret`. Reach
  out to [Wink Support](wink-support) for your own. They will probably call it
  `client_id` and `client_secret`.
- `username`: Your [Wink](wink) username.
- `password`: Your [Wink](wink) password.

The `curves` Object should map arbitrary curve names to values parseable as
valid [Thermostat](thermostat) options. See the [Thermostat docs](thermostat)
for more information.

The `devices` Object should map unique `device_type/devive_id` pairs, as
defined by [Wink](wink), to an Object with that Thing's `desired_state` (also
as defined by [Wink](wink)).

Importantly, the touch point between the two is through _rendering_ values in
the `desired_state` from `curves`. Every tick, Onrein queries the current value
of all the configured `curves`, and every leaf String in `devices` starting
with `$` is evaluated as a JavaScript expression with `curves` as an Object
of the configured, arbitrary keys to those values.

Keep in mind that only Things added to your Wink account may be controlled by
Onrein.

### Command: `status`

```
onrein status
```

Queries the current status (`last_reading` in the [Wink](wink) API) of all
devices associated with the account defined in `MANIFEST`, printing a valid
`devices` config to STDOUT. See `onrein start` for more information.

## TODO

- [ ] Query status for only the active set of devices.
- [ ] Query status for active curves.
- [ ] Updating the active set of devices and curves through the CLI.
- [ ] Exporting the active set of devices and curves as a valid manifest.
- [ ] Describing arbitrary requests available to `devices`.
- [ ] Reading state from sensors, consumable by `devices`.
- [ ] Triggers - perform actions or state changes based on `curve` thresholds.
- [ ] Support for other vendors, including more maker-friendly providers
  like Arduino, BeagleBone, and Electric Imp.

## What's in a name?

My name is Schoon, which is Dutch for "clean". This is a "daemon", which is can
be characterized as an "unclean" spirit, and the Dutch word for unclean is
"onrein". Furthermore, `onrein` behaves like your favorite household imp or
spirit, with a mind of its own, working behind the scenes as it sees fit,
sometimes turning your lights on and off.

[iot]: https://en.wikipedia.org/wiki/Internet_of_Things
[thermostat]: https://www.npmjs.com/package/thermostat
[wink]: http://docs.wink.apiary.io/
[wink-support]: http://www.wink.com/help/contact/
