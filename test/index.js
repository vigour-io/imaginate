'use strict'

const fs = require('fs')
const http = require('http')
const path = require('path')
const Canvas = require('canvas')
const request = require('request')
const urlinate = require('urlinate')
const test = require('tape')
const imaginator = require('../lib/imaginator')

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

test.onFinish(function () {
  sourceHandle.close(function () {
    console.log('Source image server shut down')
  })
})

function createImg (t, transforms, cb) {
  const imaginatorURL = 'http://localhost:3000'
  var errors = 0

  var handle = imaginator.start(function () {
    var image = urlinate(imaginatorURL, {
      input: source,
      use: transforms
    })
    request(image, { encoding: null }, function (error, response, observed) {
      if (error) {
        errors += 1
        t.fail('Failed getting transformed image', error)
      }
      t.equal(observed.length > 0, true, 'an image is created')
      handle.close(function () {
        t.equal(errors === 0, true, 'no errors and everything can be terminated properly')
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
