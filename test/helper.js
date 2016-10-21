'use strict'

const UpRingKV = require('..')
const joinTimeout = 200

function build (main) {
  const base = []

  if (main && main.whoami) {
    base.push(main.whoami())
  }

  return UpRingKV({
    base,
    logLevel: 'error',
    hashring: {
      joinTimeout
    }
  })
}

build.joinTimeout = joinTimeout

module.exports.build = build
