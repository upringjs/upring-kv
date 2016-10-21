'use strict'

const build = require('./helper').build
const t = require('tap')
const test = t.test
const maxInt = Math.pow(2, 32) - 1

test('get and put', function (t) {
  t.plan(8)

  const a = build()
  t.tearDown(a.close.bind(a))

  a.upring.on('up', function () {
    t.pass('a up')
    const b = build(a)

    t.tearDown(b.close.bind(b))

    b.upring.on('up', function () {
      t.pass('b up')
      var key = 'hello'

      // this is the instance upring, b
      for (var i = 0; i < maxInt && !this.allocatedToMe(key); i += 1) {
        key = 'hello' + i
      }
      // key is now allocated to a b

      a.put(key, 'world', function (err) {
        t.error(err)

        b.get(key, function (err, value) {
          t.error(err)
          t.equal(value, 'world')

          b.close(function () {
            t.pass('closed')

            a.get(key, function (err, value) {
              t.error(err)
              t.equal(value, 'world')
            })
          })
        })
      })
    })
  })
})
