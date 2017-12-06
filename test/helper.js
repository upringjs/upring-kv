'use strict'

const upring = require('upring')
const upringKV = require('..')

function build (main) {
  const base = []

  if (main && main.whoami) {
    base.push(main.whoami())
  }

  const instance = upring({
    logLevel: 'fatal',
    base: base,
    hashring: {
      joinTimeout: 200,
      replicaPoints: 10
    }
  })

  instance.use(upringKV)

  return instance
}

module.exports.build = build
