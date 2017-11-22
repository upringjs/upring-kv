'use strict'

const clone = require('clone')
const nes = require('never-ending-stream')
const commands = require('./lib/commands')

module.exports = function (upring, opts, next) {
  if (upring.kv) {
    return next(new Error('kv property already exist'))
  }
  upring.kv = new UpRingKV(upring, opts)
  next()
}

function UpRingKV (upring, opts) {
  opts = opts || {}

  this.upring = upring

  this.closed = false
  this.ns = opts.namespace || 'kv'

  commands(this)

  // expose the parent logger
  this.logger = this.upring.logger
}

UpRingKV.prototype.put = function (key, value, cb) {
  if (!this.upring.isReady) {
    this.upring.once('up', this.put.bind(this, key, value, cb))
    return
  }

  if (this.upring.allocatedToMe(key)) {
    value = clone(value)
  }

  if (typeof cb === 'function') {
    this.upring.request({ key, value, ns: this.ns, cmd: 'put' }, cb)
  } else {
    this.upring.requestp({ key, value, ns: this.ns, cmd: 'put' })
  }
}

UpRingKV.prototype.get = function (key, cb) {
  if (!this.upring.isReady) {
    this.upring.once('up', this.get.bind(this, key, cb))
    return
  }

  if (typeof cb === 'function') {
    this.upring.request({ key, ns: this.ns, cmd: 'get' }, function (err, result) {
      cb(err, result ? result.value : null)
    })
  } else {
    return new Promise((resolve, reject) => {
      this.upring.requestp({ key, ns: this.ns, cmd: 'get' })
        .then(result => resolve(result.value))
        .catch(err => reject(err))
    })
  }
}

UpRingKV.prototype.liveUpdates = function (key) {
  const result = nes.obj((done) => {
    this.upring.request({ key, ns: this.ns, cmd: 'liveUpdates' }, function (err, res) {
      if (err) {
        done(err)
        return
      }

      result.emit('newStream')

      done(null, res.streams.updates)
    })
  })

  return result
}
