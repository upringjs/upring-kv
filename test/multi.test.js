'use strict'

const build = require('./helper').build
const t = require('tap')
const test = t.test
const maxInt = Math.pow(2, 32) - 1

test('get and put', function (t) {
  t.plan(8)

  const a = build()
  t.tearDown(a.close.bind(a))

  a.on('up', function () {
    t.pass('a up')
    const b = build(a)

    t.tearDown(b.close.bind(b))

    b.on('up', function () {
      t.pass('b up')
      var key = 'hello'

      // this is the instance upring, b
      for (var i = 0; i < maxInt && !this.allocatedToMe(key); i += 1) {
        key = 'hello' + i
      }
      // key is now allocated to b

      a.kv.put(key, 'world', function (err) {
        t.error(err)

        b.kv.get(key, function (err, value) {
          t.error(err)
          t.equal(value, 'world')

          b.close(function () {
            t.pass('closed')

            a.kv.get(key, function (err, value) {
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

  a.on('up', function () {
    t.pass('a up')
    const b = build(a)

    t.tearDown(b.close.bind(b))

    b.on('up', function () {
      t.pass('b up')

      b.kv.get('hello', function (err, res) {
        t.error(err)
        t.equal(res, undefined)

        const c = build(a)

        t.tearDown(c.close.bind(c))

        c.on('up', function () {
          t.pass('c up')

          c.kv.get('hello', function (err, res) {
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

  a.on('up', function () {
    t.pass('a up')
    const b = build()

    t.tearDown(b.close.bind(b))

    b.on('up', function () {
      t.pass('b up')

      var key = 'hello'

      for (var i = 0; i < maxInt && !a.allocatedToMe(key); i += 1) {
        key = 'hello' + i
      }
      // key is now allocated to a

      a.kv.put(key, 'world', function (err) {
        t.error(err)
        b.join(a.whoami(), function () {
          t.pass('b joined')

          b.kv.get(key, function (err, value) {
            t.error(err)
            t.equal(value, 'world')

            var c

            b.once('peerDown', function (peer) {
              c = build(b)

              t.tearDown(c.close.bind(c))

              b.on('peerUp', function (peer) {
                c.ready(() => {
                  c.kv.get(key, function (err, value) {
                    t.error(err)
                    t.equal(value, 'world')

                    closeAndGet()
                  })
                })
              })

              c.on('up', function () {
                t.pass('c joined')
              })
            })

            function closeAndGet () {
              b.close(function () {
                t.pass('b closed')

                c.kv.get(key, function (err, value) {
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

  a.on('up', function () {
    t.pass('a up')
    const b = build(a)

    t.tearDown(b.close.bind(b))

    b.on('up', function () {
      t.pass('b up')
      var key = 'bbb'

      // this is the instance upring, b
      for (var i = 0; i < maxInt && !this.allocatedToMe(key); i += 1) {
        key = 'bbb' + i
      }
      // key is now allocated to b

      a.kv.put(key, 'world', function (err) {
        t.error(err)

        const stream = a.kv.liveUpdates(key)
        const expected = ['world', 'matteo', 'luca']

        stream.on('data', function (chunk) {
          t.deepEqual(chunk, expected.shift(), 'chunk matches')
        })

        stream.on('error', function () {
          t.fail('no error in stream')
        })

        stream.once('newStream', function () {
          b.kv.put(key, 'matteo', function (err) {
            t.error(err)

            stream.once('data', function () {
              b.close(function () {
                t.pass('closed')

                a.kv.put(key, 'luca', function (err) {
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
