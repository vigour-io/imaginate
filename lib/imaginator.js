'use strict'

const http = require('http')
const connect = require('connect')
const imaginate = require('./')

module.exports = exports = {
  start: function start (cb) {
    var app = connect()
    app.use(imaginate())
    if (process.env.NODE_ENV !== 'production') {
      app.use(require('errorhandler')())
    }
    return http.createServer(app).listen(process.env.IMAGINATOR_PORT || 0, cb)
  }
}
