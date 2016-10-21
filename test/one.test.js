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
