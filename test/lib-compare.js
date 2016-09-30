'use strict'

// const http = require('http')
const path = require('path')
const fs = require('fs')
const spawn = require('vigour-spawn')
const Jimp = require('jimp')
const test = require('tape')
const Canvas = require('canvas')
const Image = Canvas.Image
const cResize = require('ctx-resize')
// const imaginator = require('../lib/imaginator')

const width = 300
const height = 100

test('jimp', function (t) {
  var start = Date.now()
  Jimp.read(path.join(__dirname, 'data', 'nestor.jpg'), function (err, img) {
    if (err) {
      console.error('read error cb', err.stack || err)
      throw err
    }
    img.cover(width, height)
      .write(path.join(__dirname, 'jimp-cover300x100.png'), function () {
        var end = Date.now()
        var delta = (end - start) / 1000
        t.comment(delta + 's')
        t.ok(delta > 0 && delta < 0.5, 'Takes less than half a second')
        t.end()
      })
  }).catch(function (reason) {
    t.fail('read error catch')
    console.error('read error', reason.stack || reason)
  })
})

test('imagemagick', function (t) {
  var start = Date.now()
  var dimensions = `${width}x${height}`
  spawn('convert ' +
    [
      '-limit Area 134217728',
      '-limit Disk 10gb',
      '-limit Map 128',
      '-limit time 7',
      '-limit thread 2'
    ].join(' ') +
    ' ' + path.join(__dirname, 'data', 'nestor.jpg') +
    ' -resize ' + dimensions + '^' +
    ' -gravity Center' +
    ' -crop ' + dimensions + '+0+0' +
    ' -format PNG' +
    ' ' + path.join(__dirname, `im-convert${width}x${height}.png`)
  ).then(() => {
    var end = Date.now()
    var delta = (end - start) / 1000
    t.comment(delta + '')
    t.ok(delta > 0 && delta < 0.5, 'Takes less than half a second')
    t.end()
  }, (reason) => {
    t.fail('spawn error catch')
    console.error('spawn error', reason.stack || reason)
  })
})

test('canvas', function (t) {
  var start = Date.now()
  fs.readFile(path.join(__dirname, 'data', 'nestor.jpg'), function (err, buf) {
    if (err) {
      t.fail('fs.readFile error')
      console.error('fs.readFile error', err.stack || err)
    } else {
      let img = new Image()
      img.src = buf
      let canvas = new Canvas(img.width, img.height)
      let ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const resize = cResize({
        width,
        height
      })
      resize(canvas, function (err, newCanvas) {
        if (err) {
          t.fail('resize error')
          console.error('resize error', err.stack || err)
        } else {
          let rs = newCanvas.pngStream()
          let ws = fs.createWriteStream(path.join(__dirname, `canvas${width}x${height}.png`))
          rs.pipe(ws)
          rs.on('end', function () {
            let end = Date.now()
            let delta = (end - start) / 1000
            t.comment(delta + '')
            t.ok(delta > 0 && delta < 0.5, 'Takes less than half a second')
            t.end()
          })
        }
      })
    }
  })
})

// const source = 'http://localhost:3001'
// var sourceHandle
// var srcImg
// test('SETUP', function (t) {
//   const server = http.createServer(function (req, res) {
//     res.statusCode = 200
//     var rs = fs.createReadStream(path.join(__dirname, 'data', 'nestor.jpg'))
//     rs.pipe(res)
//   })
//   sourceHandle = server.listen(3001, function () {
//     request(source, { encoding: null }, function (error, response, data) {
//       if (error) {
//         throw new Error('Unable to get source image: ' + error)
//       }
//       srcImg = new Canvas.Image()
//       srcImg.src = data
//       t.end()
//     })
//   })
// })

// test('node-canvas', function (t) {
//   var start = Date.now()
//   var handle = imaginator.start(function () {
//     request(urlinate('http://localhost:3000', {
//       input: 'http://localhost:3001',
//       use: [
//         ['ctx-resize', {
//           width: width,
//           height: height
//         }]
//       ]
//     }), function () {
//
//     })
//   })
// })

// test('TEARDOWN', function (t) {
//   sourceHandle.stop()
//   t.end()
// })
