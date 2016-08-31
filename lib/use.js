'use strict'

var qs = require('qs')

module.exports = exports = function use (canvas, transforms, idx, cb) {
  if (typeof idx === 'function') {
    cb = idx
    idx = 0
  }
  let item = transforms[idx]

  if (item) {
    let parsed = qs.parse(item)
    let toTransform = require(parsed[0])
    let opts = parsed[1]
    toTransform(qs.parse(opts))(canvas, function (err, newCanvas) {
      if (err) {
        console.error(':(', err)
      } else {
        idx += 1
        use(newCanvas, transforms, idx, cb)
      }
    })
  } else {
    cb(null, canvas)
  }
}
