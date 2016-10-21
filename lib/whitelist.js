'use strict'

const auth = require('basic-auth')
var cloud = require('./cloud')
var error = require('./error')

function getWhitelist (res) {
  res.statusCode = 200
  cloud.get('whitelist', function (err, whitelistJson) {
    if (err) {
      error('Storage unreachable', err)
      res.statusCode = 500
      res.write('Internal Server Error')
      res.end()
    } else {
      res.write(whitelistJson || '{}')
      res.end()
    }
  })
}

function setWhitelist (req, res, imaginator) {
  imaginator.ready.set({ val: false })
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
          error("Storage unreachable: Can't set whitelist", err)
          res.statusCode = 500
          res.write('Internal Server Error')
          res.end()
        } else {
          res.statusCode = 202
          res.write('Success')
          res.end()
          imaginator.clean(function (err) {
            if (err) {
              error("Can't clean (npm prune)", err)
            }
            imaginator.installTransforms(function (err) {
              if (err) {
                error("Can't install transforms", err)
              } else {
                imaginator.ready.set({ val: true })
                console.log('done')
              }
            })
          })
        }
      })
    })
  }
}

console.log('exporting whitelist')
module.exports = exports = function factory (imaginator) {
  return function middleware (req, res, next) {
    if (req.method === 'GET') {
      if (imaginator.ready.val === true) {
        getWhitelist(res)
      } else {
        imaginator.ready.once(function () {
          getWhitelist(res)
        })
      }
    } else if (req.method === 'POST') {
      if (imaginator.ready.val === true) {
        setWhitelist(req, res, imaginator)
      } else {
        imaginator.ready.once(function (val) {
          setWhitelist(req, res, imaginator)
        })
      }
    } else {
      next()
    }
  }
}
