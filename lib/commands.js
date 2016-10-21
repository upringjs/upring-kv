'use strict'

function load (kv) {
  const upring = kv.upring
  const pairs = new Map()

  upring.add('ns:kv,cmd:put', function (req, reply) {
    const key = req.key
    const dest = upring._hashring.next(key)
    var needReply = true

    if (upring.allocatedToMe(key)) {
      const tracker = upring.track(key, { replica: true })
      tracker.on('replica', sendData)
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
    reply(null, { key: req.key, value: pairs.get(req.key) })
  })

  function bigError (err) {
    if (err) {
      upring.emit('error', err)
    }
  }
}

module.exports = load