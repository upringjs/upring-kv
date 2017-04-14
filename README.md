# upring-kv

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]

Key Value store on top of Upring.

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

## Install

```
npm i upring-kv --save
```

## Usage

See [./bin.js](./bin.js) for exposing upring-kv over HTTP.
This file contains a small http API to get/put data into the
key-value store. Each URL equals to a given key.

To use is, follow these instructions. First, install some
dependencies:

```
npm i upring-kv pino baseswim -g
```

Then, we need to figure out what is our ip.

On Linux:

```sh
export MYIP=`ip addr show wlan0 | grep -Po 'inet \K[\d.]+'`
```

On Mac:

```sh
export MYIP=`ipconfig getifaddr en0`
```

The export phase needs to be done for every opened shell.

Then we can start our upring cluster. We will use a
[baseswim](http://npm.im/baseswim) node to simplify bootstrapping.

```sh
# on one shell
baseswim --host $MYIP --port 7979 | pino
# on another shell
upring-kv -p 3042 $MYIP:7979 | pino
# on another shell
upring-kv -p 3043 $MYIP:7979 | pino
# on another shell
upring-kv -p 3044 $MYIP:7979 | pino
```

Then we can query our key/value storage using basic curl.

```
curl -v localhost:3042
curl -X POST -d 'hello upring' localhost:3043
curl -v localhost:3044
# on another shell
curl localhost:3042?live=true # use SSE to send updates
# one more shell
curl -X POST -d 'by Matteo' localhost:3043
```

## API

  * <a href="#constructor"><code>UpRingKV</code></a>
  * <a href="#get"><code>kv#<b>get()</b></code></a>
  * <a href="#put"><code>kv#<b>put()</b></code></a>
  * <a href="#liveUpdates"><code>kv#<b>liveUpdates()</b></code></a>

-------------------------------------------------------
<a name="constructor"></a>
### new UpRingKV(opts)

All the options of [UpRing][upring], with the following added:

* `upring`: an already initialized `UpRing` instance that has not
  already emitted `'up'`

-------------------------------------------------------
<a name="get"></a>
### kv.get(key, cb(err, value))

Get a value from the hashring.

-------------------------------------------------------
<a name="put"></a>
### kv.put(key, value, cb(err))

Put `value` in the hashring for the given key.

-------------------------------------------------------
<a name="liveUpdates"></a>
### kv.liveUpdates(key)

Returns a `Readable` stream in objectMode, which will include
all updates of given `key`.
It will emit the last value that was [`put`](#put), and it will re-emit
it when reconnecting between multiple hosts.

<a name="acknowledgements"></a>
## Acknowledgements

This project is kindly sponsored by [nearForm](http://nearform.com).

## License

MIT

[coveralls-badge]: https://coveralls.io/repos/github/upringjs/upring-kv/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/upringjs/upring-kv?branch=master
[npm-badge]: https://badge.fury.io/js/upring-kv.svg
[npm-url]: https://badge.fury.io/js/upring-kv
[travis-badge]: https://api.travis-ci.org/upringjs/upring-kv.svg
[travis-url]: https://travis-ci.org/upringjs/upring-kv
