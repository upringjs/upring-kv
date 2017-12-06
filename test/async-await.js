'use strict'

function testAsyncAwait (instance, t) {
  t.test('asycn await', async t => {
    t.plan(1)
    try {
      await instance.kv.put('async', 'await')
    } catch (err) {
      t.fail(err)
    }

    try {
      const value = await instance.kv.get('async')
      t.strictEqual(value, 'await')
    } catch (err) {
      t.fail(err)
    }
  })
}

module.exports = testAsyncAwait
