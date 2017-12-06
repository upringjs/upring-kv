# upring-kv

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![Coverage Status][coveralls-badge]][coveralls-url]

Key Value store plugin for UpRing.

## Install

```
npm i upring-kv --save
```

## Usage

This library exposes the standard `upring` plugin interface.  
Once you register it, it adds a `kv` name space with the API documented below.
```js
const upring = require('upring')({
  logLevel: 'info',
  base: [],
  hashring: {
    joinTimeout: 200,
    replicaPoints: 10
  }
})

upring.use(require('upring-kv'))

upring.on('up', onReady)

function onReady () {
  upring.kv.put('hello', 'world', onPut)
}

function onPut (err) {
  if (err) {
    return upring.logger.error(err)
  }
  upring.kv.get('hello', onGet)
}

function onGet (err, value) {
  if (err) {
    return upring.logger.error(err)
  }
  console.log(value)
  upring.close()
}
```

## API

  * <a href="#get"><code>kv#<b>get()</b></code></a>
  * <a href="#put"><code>kv#<b>put()</b></code></a>
  * <a href="#liveUpdates"><code>kv#<b>liveUpdates()</b></code></a>

-------------------------------------------------------
<a name="get"></a>
### kv.get(key, cb(err, value))

Get a value from the hashring.  
*async-await* is supported as well:
```js
await upring.kv.get('key')
```

-------------------------------------------------------
<a name="put"></a>
### kv.put(key, value, cb(err))

Put `value` in the hashring for the given key.
*async-await* is supported as well:
```js
await upring.kv.put('key', 'value')
```

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
