'use strict'

const upring = require('upring')({
  logLevel: 'info',
  base: [],
  hashring: {
    joinTimeout: 200,
    replicaPoints: 10
  }
})

upring.use(require('./kv'))

upring.on('up', onReady)

function onReady () {
  console.log('upring ready')
  upring.kv.put('hello', 'world', onPut)
}

function onPut (err) {
  if (err) {
    return upring.logger.error(err)
  }
  console.log('onPut')
  upring.kv.get('hello', onGet)
}

function onGet (err, value) {
  if (err) {
    return upring.logger.error(err)
  }
  console.log(value)
  upring.close()
}
