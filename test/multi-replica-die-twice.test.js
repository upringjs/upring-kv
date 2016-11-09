'use strict'

const build = require('./helper').build
const t = require('tap')
const maxInt = Math.pow(2, 32) - 1

t.plan(16)

var a = build()
t.tearDown(a.close.bind(a))

var c
var b
var key

a.upring.on('up', function () {
  t.pass('a up')

  join(a, function (instance) {
    t.pass('b up')
    b = instance

    key = 'hello'

    for (var i = 0; i < maxInt && !a.upring.allocatedToMe(key); i += 1) {
      key = 'hello' + i
    }
    // key is now allocated to a

    a.put(key, 'world', function (err) {
      t.error(err)

      b.get(key, function (err, value) {
        t.error(err)
        t.equal(value, 'world')

        afterDown(a, b, function () {
          t.pass('a closed')

          join(b, function (instance) {
            t.pass('c joined')
            c = instance

            c.get(key, function (err, value) {
              t.error(err)
              t.equal(value, 'world')

              closeBAndGet()
            })
          })
        })
      })
    })
  })
})

function afterDown (prev, next, cb) {
  var count = 0
  next.upring.once('peerDown', function () {
    if (++count === 2) {
      cb()
    }
  })
  prev.close(function () {
    if (++count === 2) {
      cb()
    }
  })
}

function join (main, cb) {
  const instance = build(main)

  t.tearDown(instance.close.bind(instance))

  instance.upring.on('up', function () {
    cb(instance)
  })
}

function closeBAndGet () {
  afterDown(b, c, function () {
    t.pass('b closed')

    c.get(key, function (err, value) {
      t.error(err)
      t.equal(value, 'world')

      join(c, function (d) {
        t.pass('d up')
        setTimeout(function () {
          afterDown(c, d, function () {
            t.pass('c closed')

            d.get(key, function (err, value) {
              t.error(err)
              t.equal(value, 'world')
            })
          })
        }, 1000)
      })
    })
  })
}
