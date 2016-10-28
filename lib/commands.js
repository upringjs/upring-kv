'use strict'

const eos = require('end-of-stream')
const Readable = require('readable-stream').Readable

function load (kv) {
  const upring = kv.upring
  const pairs = new Map()
  const streams = new Map()
  const logger = upring.logger

  upring.add('ns:kv,cmd:put', function (req, reply) {
    const key = req.key
    const dest = upring._hashring.next(key)
    var needReply = true

    if (upring.allocatedToMe(key)) {
      const tracker = upring.track(key, { replica: true })
      tracker.on('replica', sendData)
      tracker.on('moved', function () {
        const rs = streams.get(key) || []
        rs.forEach((stream) => stream.destroy())
        streams.delete(key)
      })
      if (dest) {
        sendData(dest, reply)
        needReply = false
      }
    }

    logger.debug({ key, value: req.value }, 'setting data')

    pairs.set(key, req.value, reply)

    if (needReply) {
      reply()
    }

    const array = streams.get(key)

    if (array) {
      array.forEach((stream) => stream.push(req.value))
    }

    function sendData (peer, cb) {
      if (typeof cb !== 'function') {
        cb = bigError
      }
      upring.peerConn(peer).request(req, function (err) {
        if (err) {
          cb(err)
          return
        }

        logger.info({ key }, 'replicated key')

        cb()
      })
    }
  })

  upring.add('ns:kv,cmd:get', function (req, reply) {
    const value = pairs.get(req.key)
    const key = req.key
    req.skipList = req.skipList || []
    req.skipList.push(upring.whoami())
    const dest = upring._hashring.next(key, req.skipList)

    if (value || !(dest && upring.allocatedToMe(key))) {
      reply(null, { key, value })
    } else {
      logger.debug({ key }, 'checking if we are in the middle of a migration')
      upring.peerConn(dest)
        .request(req, function (err, res) {
          if (res && !pairs.has(req.key)) {
            logger.debug({ key }, 'set data because of migration')
            pairs.set(req.key, res.value)
          }
          reply(err, res)
        })
    }
  })

  upring.add('ns:kv,cmd:liveUpdates', function (req, reply) {
    var array = streams.get(req.key)

    if (!array) {
      array = []
      streams.set(req.key, array)
    }

    const updates = new Readable({
      objectMode: true
    })

    updates._read = function () {}

    eos(updates, function () {
      array.splice(array.indexOf(updates), 1)
    })

    array.push(updates)

    const value = pairs.get(req.key)
    if (value) {
      updates.push(value)
    }

    reply(null, { streams: { updates } })
  })

  function bigError (err) {
    if (err) {
      upring.emit('error', err)
    }
  }
}

module.exports = load
