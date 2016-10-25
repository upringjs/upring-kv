'use strict'

const build = require('./helper').build
const t = require('tap')
const test = t.test

const instance = build()

t.tearDown(instance.close.bind(instance))

test('get and put', function (t) {
  t.plan(3)

  instance.put('hello', 'world', function (err) {
    t.error(err)

    instance.get('hello', function (err, value) {
      t.error(err)
      t.equal(value, 'world')
    })
  })
})

test('get and JS objects', function (t) {
  t.plan(3)

  instance.put('hello', { a: 42 }, function (err) {
    t.error(err)

    instance.get('hello', function (err, value) {
      t.error(err)
      t.deepEqual(value, { a: 42 })
    })
  })
})

test('clones the object', function (t) {
  t.plan(3)

  const obj = { a: 42 }
  instance.put('hello', obj, function (err) {
    t.error(err)

    instance.get('hello', function (err, value) {
      t.error(err)
      t.notEqual(value, obj)
    })
  })
})

test('liveUpdates', function (t) {
  t.plan(5)

  const expected = [
    'world',
    'matteo'
  ]

  const stream = instance.liveUpdates('hello')
    .on('data', function (data) {
      t.deepEqual(data, expected.shift())
      if (expected.length === 0) {
        stream.destroy()
        setImmediate(t.pass.bind(t), 'destroyed')
      }
    })

  t.tearDown(stream.destroy.bind(stream))

  instance.put('hello', 'world', function (err) {
    t.error(err)
    instance.put('hello', 'matteo', function (err) {
      t.error(err)
    })
  })
})

test('liveUpdates double', function (t) {
  t.plan(8)

  const expected1 = [
    'world',
    'matteo'
  ]

  const expected2 = [
    'world',
    'matteo'
  ]

  const stream1 = instance.liveUpdates('hello')
    .on('data', function (data) {
      t.deepEqual(data, expected1.shift())
      if (expected1.length === 0) {
        stream1.destroy()
        setImmediate(t.pass.bind(t), 'destroyed')
      }
    })

  t.tearDown(stream1.destroy.bind(stream1))

  const stream2 = instance.liveUpdates('hello')
    .on('data', function (data) {
      t.deepEqual(data, expected2.shift())
      if (expected2.length === 0) {
        stream2.destroy()
        setImmediate(t.pass.bind(t), 'destroyed')
      }
    })

  t.tearDown(stream2.destroy.bind(stream2))

  instance.put('hello', 'world', function (err) {
    t.error(err)
    instance.put('hello', 'matteo', function (err) {
      t.error(err)
    })
  })
})
