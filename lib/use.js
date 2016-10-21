'use strict'

var error = require('./error')
var qs = require('qs')

/**
 * @id use
 * @function use
 * Passes a canvas along a chain of transforms. This is considered an internal function and it's API is subject to change
 */
console.log('exporting use')
module.exports = exports = function use (canvas, transforms, options, idx, cb) {
  if (typeof idx === 'function') {
    cb = idx
    idx = 0
  }
  let item = transforms[idx]

  if (item) {
    let parsed = qs.parse(item)
    if (!options.whitelist) {
      transform(parsed, canvas, transforms, options, idx, cb)
    } else {
      options.whitelist(parsed[0], function (err, whitelisted) {
        if (err) {
          cb(err)
        } else {
          if (whitelisted) {
            transform(parsed, canvas, transforms, options, idx, cb)
          } else {
            cb('!whitelisted', parsed[0])
          }
        }
      })
    }
  } else {
    cb(null, canvas)
  }
}

function transform (parsed, canvas, transforms, options, idx, cb) {
  // The transforms are responsible for throwing nice errors
  try {
    let toTransform = require(parsed[0])
    let opts = parsed[1]
    toTransform(qs.parse(opts))(canvas, function (err, newCanvas) {
      if (err) {
        error(`Error during ${parsed[0]} transform`)
        cb(err)
      } else {
        idx += 1
        exports(newCanvas, transforms, options, idx, cb)
      }
    })
  } catch (e) {
    cb(e)
  }
}
