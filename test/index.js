'use strict'

const fs = require('fs')
const http = require('http')
const path = require('path')
const Canvas = require('canvas')
const request = require('request')
const urlinate = require('urlinate')
const test = require('tape')
const imaginator = require('../lib/imaginator')
const imaginatorURL = 'http://localhost:3000'
const source = 'http://localhost:3001'

var sourceHandle
var srcImg

test('SETUP', function (t) {
  const server = http.createServer(function (req, res) {
    res.statusCode = 200
    var rs = fs.createReadStream(path.join(__dirname, 'data', 'nestor.jpg'))
    rs.pipe(res)
  })
  sourceHandle = server.listen(3001, function () {
    request(source, { encoding: null }, function (error, response, data) {
      if (error) {
        throw new Error('Unable to get source image: ' + error)
      }
      srcImg = new Canvas.Image()
      srcImg.src = data
      t.end()
    })
  })
})

function createImg (t, transforms, cb) {
  var errors = 0
  imaginator.start({ whitelist: false }, function (err, handle) {
    if (err) {
      t.fail('Failed to start imaginator: ' + err)
      errors += 1
    }
    var image = urlinate(imaginatorURL, {
      input: source,
      use: transforms
    })
    request(image, { encoding: null }, function (error, response, observed) {
      if (error) {
        errors += 1
        t.fail('Failed getting transformed image ' + error)
      } else {
        t.equal(observed.length > 0, true, 'an image is created')
      }
      handle.close(function () {
        t.equal(errors, 0, 'no errors and everything can be terminated properly')
        cb(observed)
      })
    })
  })
}

test('imaginator', function (t) {
  createImg(t, [], function (observed) {
    var img = new Canvas.Image()
    img.src = observed
    t.equal(img.width, srcImg.width, 'correct width')
    t.equal(img.height, srcImg.height, 'correct height')
    t.end()
  })
})

// test('whitelist', function (t) {
//   var errors = 0
//
//   var handle = imaginator.start(function name () {
//     request(imaginatorURL + '/whitelist', function (error, response, observed) {
//       if (error) {
//         t.fail('Failed getting whitelist: ' + error)
//         errors += 1
//       }
//       attempt(403, 'blocks non-whitelisted transforms', function () {
//         const newExpected = {
//           'ctx-identity': '^1.0.0',
//           'ctx-resize': '^1.0.0'
//         }
//         request(imaginatorURL + '/whitelist', { method: 'POST', body: JSON.stringify(newExpected), headers: {
//           Authorization: 'Basic YWRtaW46'
//         } }, function (error, response, observed) {
//           if (error) {
//             t.fail('Failed to edit whitelist: ' + error)
//             errors += 1
//           } else {
//             t.equal(response.statusCode, 202, 'successful edit responds with 202')
//             request(imaginatorURL + '/whitelist', function (error, response, observed) {
//               if (error) {
//                 t.fail('Failed to get edited whitelist: ' + error)
//                 errors += 1
//               } else {
//                 t.equal(response.statusCode, 200, 'getting edited whitelist responds with 200')
//                 t.deepEqual(JSON.parse(observed), newExpected, 'edited json is correct')
//               }
//             })
//             attempt(200, 'allows whitelisted transforms', function () {
//               handle.close(function () {
//                 t.equal(errors, 0, 'no errors and everything can be terminated properly')
//                 t.end()
//               })
//             })
//           }
//         })
//       })
//     })
//   })
//
//   const image = urlinate(imaginatorURL, {
//     input: source,
//     use: [
//       ['ctx-identity']
//     ]
//   })
//   function attempt (expected, label, cb) {
//     request(image, { encoding: null }, function (error, response, body) {
//       if (error) {
//         t.fail('Failed to get image: ' + error)
//       } else {
//         t.equal(response.statusCode, expected, label)
//       }
//       cb()
//     })
//   }
// })

test('imaginator + identity', function (t) {
  createImg(t, [
    ['ctx-identity']
  ], function (observed) {
    var img = new Canvas.Image()
    img.src = observed
    t.equal(img.width, srcImg.width, 'correct width')
    t.equal(img.height, srcImg.height, 'correct height')
    t.end()
  })
})

test('imaginator + resize', function (t) {
  const width = 20
  const height = 20
  createImg(t, [
    ['ctx-resize', {
      width,
      height
    }]
  ], function (observed) {
    var img = new Canvas.Image()
    img.src = observed
    t.equal(img.width, width, 'correct width')
    t.equal(img.height, height, 'correct height')
    t.end()
  })
})

test('imaginator + identity + resize', function (t) {
  const width = 20
  const height = 20
  createImg(t, [
    ['ctx-identity'],
    ['ctx-resize', {
      width,
      height
    }]
  ], function (observed) {
    var img = new Canvas.Image()
    img.src = observed
    t.equal(img.width, width, 'correct width')
    t.equal(img.height, height, 'correct height')
    t.end()
  })
})

test.onFinish(function () {
  sourceHandle.close(function () {
    console.log('Source image server shut down')
  })
})
