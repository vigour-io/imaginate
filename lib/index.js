'use strict'

const url = require('url')
const urlinate = require('urlinate')
const request = require('request')
const Canvas = require('canvas')
const Image = Canvas.Image
const use = require('./use')
/**
 * @id imaginate
 * @function imaginate
 * @param options {object} - Coming soon
 * @returns middleware {function} - Responds to requests with images created using the info provided in the query string
 */
module.exports = exports = function imaginate (options) {
  if (!options) {
    options = {}
  }
  return function middleware (req, res, next) {
    const parsed = url.parse(req.originalUrl)
    if (parsed.query) {
      const query = urlinate.parse(parsed.query)
      const input = query.input

      request({ url: input, encoding: null }, function (error, response, body) {
        if (error) {
          console.error(':(', error)
          res.statusCode = response.statusCode
          response.pipe(res)
        } else {
          var img = new Image()
          img.src = body
          var canvas = new Canvas(img.width, img.height)
          var ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)

          use(canvas, query.use, options, function (err, newCanvas) {
            if (err) {
              if (err === '!whitelisted') {
                res.statusCode = 403
                res.write('Forbidden: ' + newCanvas)
                return res.end()
              } else {
                return next(err)
              }
            }
            res.statusCode = 200
            let stream = newCanvas.pngStream()
            stream.pipe(res)
            stream.on('error', next)
          })
        }
      })
    } else {
      next()
    }
  }
}
