'use strict'

module.exports = exports = function (msg, err) {
  if (process.env.NODE_ENV === 'production') {
    // send slack a message
    console.log('TODO: send following message to Slack')
    console.log(msg, err)
  } else {
    console.error(msg, err)
  }
}
