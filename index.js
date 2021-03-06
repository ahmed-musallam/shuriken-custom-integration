/**
 * A Bot for Slack!
 */
// [START app]
const express = require('express')

const app = express()

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!').end()
})

// Start the server
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})

/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */
function onInstallation (bot, installer) {
  if (installer) {
    bot.startPrivateConversation({ user: installer }, function (err, convo) {
      if (err) throw new Error(err)
      else {
        convo.say('I am a bot that has just joined your team')
        convo.say('You must now /invite me to a channel so that I can be of use!')
      }
    })
  }
}

/**
 * Get initial config for controller
 */
function getConfig () {
  // Currently uses filesystem storage, which is adequate for one slack workspace
  // Botkit has a store integration with mongodb
  const datastoreStorage = require('./lib/GCPDatastore')({projectId: 'shuriken-bot'})
  return {
    // json_file_store: ((process.env.TOKEN) ? './db_slack_bot_ci/' : './db_slack_bot_a/') // use a different name if an app or CI
    storage: datastoreStorage
  }
}

/**
 * Are we being run as an app or a custom integration? The initialization will differ, depending
 */
function configureController (config) {
  var controller
  const fileToken = require('fs').readFileSync('token.txt')
  if (process.env.TOKEN || process.env.SLACK_TOKEN || fileToken) {
    // Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations')
    let token
    if (process.env.TOKEN || process.env.SLACK_TOKEN) {
      token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN
    }
    else {
      token = fileToken
    }
    console.log('Token found, using it!')
    controller = customIntegration.configure(token, config, onInstallation)
  } else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    // Treat this as an app
    var app = require('./lib/apps')
    controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation)
  } else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment')
    process.exit(1)
  }
  return controller
}

/****************************
 *          MAIN
 ***************************/
const controller = configureController(getConfig())
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
  console.log('** The RTM api just connected!')
})
controller.on('rtm_close', function (bot) {
  console.log('** The RTM api just closed')
  // you may want to attempt to re-open
})

const Shuriken = require('./lib/shuriken')
const shuriken = new Shuriken(controller)
