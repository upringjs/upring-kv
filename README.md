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

[coveralls-badge]: https://coveralls.io/repos/github/mcollina/upring-kv/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/mcollina/upring-kv?branch=master
[npm-badge]: https://badge.fury.io/js/upring-kv.svg
[npm-url]: https://badge.fury.io/js/upring-kv
[travis-badge]: https://api.travis-ci.org/mcollina/upring-kv.svg
[travis-url]: https://travis-ci.org/mcollina/upring-kv
