'use strict'

var qs = require('qs')

/**
 * @id use
 * @function use
 * Passes a canvas along a chain of transforms. This is considered an internal function and it's API is subject to change
 */
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
      // console.log('parsed[0]', parsed[0])
      options.whitelist(parsed[0], function (err, whitelisted) {
        if (err) {
          cb(err)
        } else {
          // console.log('whitelisted', whitelisted)
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
  let toTransform = require(parsed[0])
  let opts = parsed[1]
  toTransform(qs.parse(opts))(canvas, function (err, newCanvas) {
    if (err) {
      console.error(':(', err)
    } else {
      idx += 1
      exports(newCanvas, transforms, options, idx, cb)
    }
  })
}
