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
console.log('options', options)
var s3 = new AWS.S3(options)

module.exports = exports = {
  get (name, cb) {
    const params = {
      Key: name + '.json'
    }
    console.log('get params', params)
    return s3.getObject(params, cb)
  },
  set (name, body, cb) {
    const params = {
      Key: name + '.json',
      Body: body
    }
    console.log('set params', params)
    return s3.putObject(params, cb)
  }
}
