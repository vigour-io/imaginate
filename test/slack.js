'use strict'

const error = require('../lib/error')
const test = require('tape')

test('Slack messaging', function (t) {
  var msg = 'Running Slack messaging tests'
  var err = 'SUCCESS'
  error(msg, err, cb)

  function cb (err) {
    if (err) {
      t.fail("Didn't work")
      t.comment(err)
    } else {
      t.equal(err, null, 'No errors')
    }
    t.end()
  }
})
