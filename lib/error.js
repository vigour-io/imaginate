'use strict'

const https = require('https')
const channel = '#' + process.env.IMAGINATOR_SLACK_CHANNEL
const tokens = process.env.IMAGINATOR_SLACK_TOKENS

// console.log('channel', channel)
// console.log('tokens', tokens)

console.log('exporting error')
module.exports = exports = function (msg, errMsg, cb) {
  if (!cb) {
    cb = exports.defaultCb
  }
  if (process.env.NODE_ENV === 'production') {
    let postData = 'payload=' + JSON.stringify({
      text: msg + '\n\n' + errMsg,
      channel
    })
    let options = {
      hostname: 'hooks.slack.com',
      port: 443,
      path: '/services/' + tokens,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }
    // console.log('options', options)
    let req = https.request(options, function (res) {
      let response = ''
      res.on('error', function (err) {
        // console.error('Erroneous response from Slack', err)
        cb(err)
      })
      res.on('data', function (chunk) {
        response += chunk
      })
      res.on('end', function () {
        if (response === 'ok') {
          // console.log('Response sent to Slack')
          cb(null)
        } else {
          // console.error('Slack response not OK', response)
          cb(response)
        }
      })
    })
    req.on('error', function (err) {
      // console.error("Can't send message to Slack!", err)
      cb(err)
    })
    req.write(postData)
    req.end()
  } else {
    console.error(msg, errMsg, "In production (`process.env.NODE_ENV === 'production'`), this message would have been sent to Slack, not merely passed to console.error")
  }
}

exports.defaultCb = function defaultCb (err) {
  if (err) {
    console.error("Couldn't send message to Slack!", err)
  } else {
    console.log(`Message sent to slack (${tokens} ${channel})`)
  }
}
