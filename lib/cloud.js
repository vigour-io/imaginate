'use strict'

const redis = require('redis')
const error = require('./error')
var client = null

module.exports = exports = {
  get: function () {
    return getClient().get.apply(client, arguments)
  },
  set: function () {
    return getClient().set.apply(client, arguments)
  }
}

function getClient () {
  if (client) {
    return client
  } else {
    client = redis.createClient(process.env.IMAGINATOR_REDIS || void 0)
    client.on('error', function (err) {
      error('Redis client error', err)
    })
    return client
  }
}
