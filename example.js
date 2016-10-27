'use strict'

const UpRingKV = require('.')
const http = require('http')

const db = UpRingKV({
  base: process.argv.slice(2),
  hashring: {
    joinTimeout: 200
  }
})

db.upring.on('up', function () {
  console.log('to start a new peer, copy and paste the following in a new terminal:')
  console.log('node example', this.whoami())

  const server = http.createServer(function (req, res) {
    switch (req.method) {
      case 'PUT':
      case 'POST':
        handlePost(req, res)
        break
      case 'GET':
        handleGet(req, res)
        break
      default:
        res.statusCode = 404
        res.end()
    }
  })

  server.listen(0, function (err) {
    if (err) {
      throw err
    }

    console.log('server listening on', server.address())
  })

  function handleGet (req, res) {
    db.get(req.url, function (err, data) {
      if (err) {
        res.statusCode = 500
        res.end(err.message)
        return
      }

      if (!data) {
        res.statusCode = 404
        res.end()
        return
      }

      res.setHeader('Content-Type', data.contentType)
      res.end(data.value)
    })
  }

  function handlePost (req, res) {
    var str = ''

    req.on('data', function (chunk) {
      str += chunk.toString()
    })

    req.on('error', function (err) {
      res.statusCode = 500
      res.end(err.message)
    })

    req.on('end', function () {
      db.put(req.url, {
        contentType: req.headers['content-type'],
        value: str
      }, function (err) {
        if (err) {
          res.statusCode = 500
          res.end(err.message)
        } else {
          res.statusCode = 200
          res.end()
        }
      })
    })
  }
})
