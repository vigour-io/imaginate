'use strict'

const path = require('path')
const http = require('http')
const error = require('./error')
const Observable = require('vigour-observable')
const connect = require('connect')
const spawn = require('vigour-spawn')
const imaginate = require('./')
const cloud = require('./cloud')
const whitelist = require('./whitelist')

module.exports = exports = {
  start (options, cb) {
    var app = connect()
    const middleware = imaginate({
      whitelist: options.whitelist
    })
    if (options.whitelist) {
      app.use('/whitelist', whitelist(exports))
    }
    app.use(function (req, res, next) {
      if (exports.ready.val === true) {
        middleware(req, res, next)
      } else {
        exports.ready.once(function () {
          middleware(req, res, next)
        })
      }
    })
    if (process.env.NODE_ENV !== 'production') {
      app.use(require('errorhandler')())
    }
    if (options.whitelist) {
      exports.clean(function (err) {
        if (err) {
          error("Can't clean (npm prune)", err)
        }
        exports.installTransforms(function (err) {
          if (err) {
            throw err
          } else {
            exports.ready.set({ val: true })
            launch(app, cb)
          }
        })
      })
    } else {
      launch(app, cb)
    }
  },
  installTransforms (cb) {
    cloud.get('whitelist', function (err, whitelistJson) {
      if (err) {
        cb(err)
      }
      try {
        var whitelist = JSON.parse(whitelistJson)
        let transforms = []
        for (let key in whitelist) {
          transforms.push(key + '@' + whitelist[key])
        }
        if (transforms.length > 0) {
          spawn('npm install ' + transforms.join(' '), { cwd: path.join(__dirname, '..') })
            .then(() => {
              cb(null)
            })
        } else {
          cb(null)
        }
      } catch (e) {
        error('Stored whitelist is invalid JSON', e)
      }
    })
  },
  clean (cb) {
    spawn('npm prune', { cwd: path.join(__dirname, '..') })
      .then(() => {
        cb(null)
      }, (reason) => {
        cb(reason)
      })
  },
  ready: new Observable({
    val: false
  })
}

function launch (app, cb) {
  var handle = http.createServer(app).listen(process.env.IMAGINATOR_PORT || 0, function () {
    cb(null, handle)
  })
}
