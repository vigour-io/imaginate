'use strict'

var AWS = require('aws-sdk')

const options = {
  apiVersion: '2006-03-01',
  params: {
    Bucket: process.env['IMAGINATOR_BUCKET']
  },
  accessKeyId: process.env['IMAGINATOR_AWS_ACCESS_KEY_ID'],
  secretAccessKey: process.env['IMAGINATOR_AWS_SECRET_ACCESS_KEY'],
  signatureVersion: 'v4'
}
var s3 = new AWS.S3(options)

var mem = {}

module.exports = exports = {
  get (name, cb) {
    if (mem[name]) {
      cb(null, mem[name])
    } else {
      const params = {
        Key: name + '.json'
      }
      s3.getObject(params, function (err, response) {
        if (err) {
          cb(err)
        } else {
          mem[name] = response.Body
          cb(null, response.Body)
        }
      })
    }
  },
  set (name, body, cb) {
    mem[name] = body
    const params = {
      Key: name + '.json',
      Body: body
    }
    return s3.putObject(params, cb)
  }
}
