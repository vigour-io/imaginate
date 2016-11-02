'use strict'

const path = require('path')
const http = require('http')
const error = require('./error')
const Observable = require('vigour-observable')
const connect = require('connect')
const semver = require('semver')
const spawn = require('vigour-spawn')
const imaginate = require('./')
const cloud = require('./cloud')
const whitelist = require('./whitelist')
const readInstalled = require('read-installed')
const root = path.join(__dirname, '..')

module.exports = exports = {
  start (options, cb) {
    console.log('starting imaginator')
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
      exports.ready.set({ val: true })
      launch(app, cb)
    }
  },
  installTransforms (cb) {
    console.log('installing transforms')
    cloud.get('whitelist', function (err, whitelistJson) {
      if (err) {
        cb(err)
      }
      console.log('reading installed')
      readInstalled(root, function (err, data) {
        if (err) {
          cb(err)
        } else {
          try {
            var whitelist = JSON.parse(whitelistJson)
            let transforms = []
            for (let key in whitelist) {
              transforms.push({ key, semver: whitelist[key] })
            }
            transforms = transforms
              .filter(function (item) {
                if (data.dependencies[item.key] && semver.satisfies(data.dependencies[item.key].version, item.semver)) {
                  return false
                }
                return true
              })
              .map(function (item) {
                return item.key + '@' + item.semver
              })
            if (transforms.length > 0) {
              console.log('installing', transforms)
              spawn('npm install ' + transforms.join(' '), { cwd: root })
                .then(() => {
                  cb(null)
                })
            } else {
              cb(null)
            }
          } catch (e) {
            error('Stored whitelist is invalid JSON', e)
          }
        }
      })
    })
  },
  clean (cb) {
    console.log('cleaning')
    cloud.get('whitelist', function (err, whitelistJson) {
      if (err) {
        cb(err)
      } else {
        console.log('reading installed')
        readInstalled(root, function (err, data) {
          if (err) {
            cb(err)
          } else {
            let whitelist = JSON.parse(whitelistJson)
            let keeperDeps = []
            let toRemove = prunables(data, [])
              .filter(function (candidate) {
                let name = candidate.name
                if (keeperDeps.indexOf(name) !== -1) {
                  return false
                }
                if (whitelist[name]) {
                  if (semver.satisfies(candidate.version, whitelist[name])) {
                    let keepers = getDeepDeps(candidate)
                    keeperDeps = keeperDeps.concat(keepers)
                    return false
                  }
                }
                return true
              })
              .filter(function (item) {
                return keeperDeps.indexOf(item.name) === -1
              })
              .map(function (item) {
                return item.name
              })
            if (toRemove.length === 0) {
              cb(null)
            } else {
              console.log('toRemove', toRemove)
              spawn(`npm uninstall ${toRemove.join(' ')}`, { cwd: root })
                .then(() => {
                  cb(null)
                }, (reason) => {
                  cb(reason)
                })
            }
          }
        })
      }
    })
  },
  ready: new Observable({
    val: false
  })
}

function getDeepDeps (item) {
  let keys = Object.keys(item.dependencies)
  let more = []
  keys.map(function (key) {
    if (item.dependencies[key].dependencies) {
      more = getDeepDeps(item.dependencies[key])
    } else if (typeof item.dependencies[key] === 'object') {
      more = getDeepDeps(item.dependencies[key])
    }
    return key
  })
  return keys.concat(more)
}

/**
 * Inspired by the prunables function found here: https://github.com/npm/npm/blob/master/lib/prune.js
 */
function prunables (data, seen) {
  var deps = data.dependencies || {}
  return Object.keys(deps).map(function (dep) {
    if (typeof deps[dep] !== 'object' || seen.indexOf(deps[dep]) !== -1) {
      return null
    }
    seen.push(deps[dep])
    if (deps[dep].extraneous) {
      var extra = deps[dep]
      delete deps[dep]
      return extra
    }
    return prunables(deps[dep], seen)
  }).filter(function (dep) { return dep !== null })
    .reduce(flat, [])
}

function launch (app, cb) {
  console.log('launching')
  var handle = http.createServer(app).listen(process.env.IMAGINATOR_PORT || 0, function () {
    cb(null, handle)
  })
}

function flat (acc, curr) {
  return acc.concat(Array.isArray(curr) ? curr.reduce(flat, []) : curr)
}
