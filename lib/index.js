'use strict'

const url = require('url')
const request = require('request')
const qs = require('qs')
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
  return function middleware (req, res, next) {
    const parsed = url.parse(req.originalUrl)
    const query = qs.parse(parsed.query)
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
        let transforms = qs.parse(query.use)
        // console.log('transforms', transforms)

        use(canvas, transforms, function (err, newCanvas) {
          if (err) {
            return next(err)
          }
          res.statusCode = 200
          let stream = newCanvas.pngStream()
          stream.pipe(res)
          stream.on('error', next)
        })
      }
    })
  }
}
