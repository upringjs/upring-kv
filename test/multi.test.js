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
      // key is now allocated to b

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

test('get empty', function (t) {
  t.plan(7)

  const a = build()
  t.tearDown(a.close.bind(a))

  a.upring.on('up', function () {
    t.pass('a up')
    const b = build(a)

    t.tearDown(b.close.bind(b))

    b.upring.on('up', function () {
      t.pass('b up')

      b.get('hello', function (err, res) {
        t.error(err)
        t.equal(res, undefined)

        const c = build(a)

        t.tearDown(c.close.bind(c))

        c.upring.on('up', function () {
          t.pass('c up')

          c.get('hello', function (err, res) {
            t.error(err)
            t.equal(res, undefined)
          })
        })
      })
    })
  })
})

test('moving data', function (t) {
  t.plan(13)

  const a = build()
  t.tearDown(a.close.bind(a))

  a.upring.on('up', function () {
    t.pass('a up')
    const b = build()

    t.tearDown(b.close.bind(b))

    b.upring.on('up', function () {
      t.pass('b up')

      var key = 'hello'

      for (var i = 0; i < maxInt && !a.upring.allocatedToMe(key); i += 1) {
        key = 'hello' + i
      }
      // key is now allocated to a

      a.put(key, 'world', function (err) {
        t.error(err)
        b.upring.join(a.whoami(), function () {
          t.pass('b joined')

          b.get(key, function (err, value) {
            t.error(err)
            t.equal(value, 'world')

            var c

            b.upring.once('peerDown', function (peer) {
              c = build(b)

              t.tearDown(c.close.bind(c))

              b.upring.on('peerUp', function (peer) {
                c.get(key, function (err, value) {
                  t.error(err)
                  t.equal(value, 'world')

                  closeAndGet()
                })
              })

              c.upring.on('up', function () {
                t.pass('c joined')
              })
            })

            function closeAndGet () {
              b.close(function () {
                t.pass('b closed')

                c.get(key, function (err, value) {
                  t.error(err)
                  t.equal(value, 'world')
                })
              })
            }

            a.close(function () {
              t.pass('a closed')
            })
          })
        })
      })
    })
  })
})

test('liveUpdates', function (t) {
  t.plan(9)

  const a = build()
  t.tearDown(a.close.bind(a))

  a.upring.on('up', function () {
    t.pass('a up')
    const b = build(a)

    t.tearDown(b.close.bind(b))

    b.upring.on('up', function () {
      t.pass('b up')
      var key = 'bbb'

      // this is the instance upring, b
      for (var i = 0; i < maxInt && !this.allocatedToMe(key); i += 1) {
        key = 'bbb' + i
      }
      // key is now allocated to b

      a.put(key, 'world', function (err) {
        t.error(err)

        const stream = a.liveUpdates(key)
        const expected = ['world', 'matteo', 'luca']

        stream.on('data', function (chunk) {
          t.deepEqual(chunk, expected.shift(), 'chunk matches')
        })

        stream.on('error', function () {
          t.fail('no error in stream')
        })

        stream.once('newStream', function () {
          b.put(key, 'matteo', function (err) {
            t.error(err)

            stream.once('data', function () {
              b.close(function () {
                t.pass('closed')

                a.put(key, 'luca', function (err) {
                  t.error(err)
                })
              })
            })
          })
        })
      })
    })
  })
})
