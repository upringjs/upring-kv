'use strict'

const eos = require('end-of-stream')
const Readable = require('readable-stream').Readable

function load (kv) {
  const upring = kv.upring
  const db = new Map()
  const streams = new Map()
  const logger = upring.logger

  function setupTracker (entry, reply, sendData) {
    if (entry.hasTracker) {
      reply()
      return
    }

    const key = entry.key

    entry.hasTracker = true
    entry.hasReplicator = false

    logger.debug({ key }, 'configuring tracker')

    const dest = upring._hashring.next(key)
    const tracker = upring.track(key, { replica: true })

    process.nextTick(function () {
      tracker.on('replica', sendData)
    })
    tracker.on('moved', function () {
      entry.hasTracker = false
      const rs = streams.get(key) || []
      rs.forEach((stream) => stream.destroy())
      streams.delete(key)
      if (!entry.hasReplicator) {
        db.delete(key)
      }
    })

    if (dest) {
      sendData(dest, reply)
      return false
    }

    return true
  }

  function setupReplicator (entry, sendData) {
    const key = entry.key
    entry.hasReplicator = true
    logger.debug({ key }, 'configuring replicator')
    upring.replica(key, function () {
      entry.hasReplicator = false
      setupTracker(entry, bigError, sendData)
    })
  }

  function Entry (key) {
    this.key = key
    this.hasTracker = false
    this.hasReplicator = false
    this.value = null
  }

  upring.add('ns:kv,cmd:put', put)

  function put (req, reply) {
    const key = req.key
    var needReply = true
    var entry = db.get(key) || new Entry(key)

    entry.value = req.value
    db.set(key, entry)

    if (upring.allocatedToMe(key)) {
      if (!entry.hasTracker) {
        needReply = setupTracker(entry, reply, sendData)
      }
    } else {
      if (!entry.hasReplicator) {
        setupReplicator(entry, bigError, sendData)
      }
    }

    logger.debug({ key, value: req.value }, 'setting data')

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
  }

  upring.add('ns:kv,cmd:get', function (req, reply) {
    const entry = db.get(req.key)
    const key = req.key
    req.skipList = req.skipList || []
    req.skipList.push(upring.whoami())
    const dest = upring._hashring.next(key, req.skipList)

    if (entry && entry.value || !dest) {
      reply(null, { key, value: entry ? entry.value : undefined })
    } else {
      logger.debug({ key }, 'checking if we are in the middle of a migration')
      upring.peerConn(dest)
        .request(req, function (err, res) {
          if (err) {
            reply(err)
            return
          }

          const entry = db.get(key)

          if (res && !entry) {
            logger.debug({ key }, 'set data because of migration')
            put({
              ns: 'kv',
              cmd: 'put',
              key,
              value: res.value
            }, function (err) {
              if (err) {
                reply(err)
                return
              }

              reply(null, res)
            })

            return
          }

          reply(null, res)
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

    const entry = db.get(req.key)
    if (entry && entry.hasTracker) {
      updates.push(entry.value)
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
