'use strict'

const eos = require('end-of-stream')

function load (kv) {
  const upring = kv.upring
  const pairs = new Map()
  const streams = new Map()

  upring.add('ns:kv,cmd:put', function (req, reply) {
    const key = req.key
    const dest = upring._hashring.next(key)
    var needReply = true

    if (upring.allocatedToMe(key)) {
      const tracker = upring.track(key, { replica: true })
      tracker.on('replica', sendData)
      tracker.on('moved', function () {
        streams.delete(key)
      })
      if (dest) {
        sendData(dest, reply)
        needReply = false
      }
    }

    upring.logger.debug({ key }, 'setting data')

    pairs.set(key, req.value, reply)

    if (needReply) {
      reply()
    }

    const array = streams.get(key)

    if (array) {
      array.forEach((stream) => stream.write(req.value))
    }

    function sendData (peer, cb) {
      cb = cb || bigError
      upring.peerConn(peer).request(req, function (err) {
        if (err) {
          cb(err)
          return
        }

        upring.logger.info({ key }, 'replicated key')

        cb()
      })
    }
  })

  upring.add('ns:kv,cmd:get', function (req, reply) {
    const value = pairs.get(req.key)
    const key = req.key
    const dest = upring._hashring.next(key)
    if (value || !dest) {
      reply(null, { key, value })
    } else if (upring.allocatedToMe(key)) {
      upring.peerConn(dest).request(req, reply)
    }
  })

  upring.add('ns:kv,cmd:liveUpdates', function (req, reply) {
    const result = req.streams.result

    if (!result) {
      reply(new Error('missing result field'))
    }

    var array = streams.get(req.key)

    if (!array) {
      array = []
      streams.set(req.key, array)
    }

    eos(result, function () {
      array.splice(array.indexOf(result), 1)
    })

    array.push(result)

    reply()
  })

  function bigError (err) {
    if (err) {
      upring.emit('error', err)
    }
  }
}

module.exports = load
