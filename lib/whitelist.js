'use strict'

const auth = require('basic-auth')
var cloud = require('./cloud')

module.exports = exports = function factory (imaginator) {
  return function middleware (req, res, next) {
    if (req.method === 'GET') {
      res.statusCode = 200
      cloud.get('whitelist', function (err, whitelistJson) {
        if (err) {
          console.error('UH OH', err)
          res.statusCode = 500
          res.write('Internal Server Error')
          res.end()
        } else {
          res.write(whitelistJson || '{}')
          res.end()
        }
      })
    } else if (req.method === 'POST') {
      let creds = auth(req)

      if (!creds || creds.name !== 'admin' || (process.env.IMAGINATOR_PASS && creds.pass !== process.env.IMAGINATOR_PASS)) {
        res.statusCode = 401
        res.write('Unauthorized')
        res.end()
      } else {
        let body = ''
        req.on('data', function (chunk) {
          body += chunk
        })
        req.on('end', function () {
          let whitelist = JSON.parse(body)
          cloud.set('whitelist', JSON.stringify(whitelist), function (err, reply) {
            if (err) {
              console.error('OH NO!', err)
              res.statusCode = 500
              res.write('Internal Server Error')
              res.end()
            } else {
              res.statusCode = 202
              res.write('Success')
              res.end()
              imaginator.installTransforms(function (err) {
                if (err) {
                  console.error('Oops', err)
                }
                console.log('done')
              })
            }
          })
        })
      }
    } else {
      next()
    }
  }
}
