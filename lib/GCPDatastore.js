/**
 * credit: https://github.com/fabito/botkit-storage-datastore
 * it was not published on NPM... so had no choice but to include it
 */

var Datastore = require('@google-cloud/datastore')

/**
 * The Botkit google cloud datastore driver
 *
 * @param {Object} config This must contain a `projectId` property
 * @returns {{teams: {get, save, all}, channels: {get, save, all}, users: {get, save, all}}}
 */
module.exports = function (config) {
  if (!config || !config.projectId) {
    throw new Error('projectId is required.')
  }

  const datastore = Datastore(config)
  const namespace = config.namespace
  const teamKind = config.teamKind || 'BotkitTeam'
  const channelKind = config.channelKind || 'BotkitChannel'
  const userKind = config.userKind || 'BotkitUser'

  return {
    teams: {
      get: get(datastore, teamKind, namespace),
      save: save(datastore, teamKind, namespace),
      all: all(datastore, teamKind, namespace)
    },
    channels: {
      get: get(datastore, channelKind, namespace),
      save: save(datastore, channelKind, namespace),
      all: all(datastore, channelKind, namespace)
    },
    users: {
      get: get(datastore, userKind, namespace),
      save: save(datastore, userKind, namespace),
      all: all(datastore, userKind, namespace)
    }
  }
}

/**
 * Given a datastore reference and a kind, will return a function that will get a single entity by key
 *
 * @param {Object} datastore A reference to the datastore Object
 * @param {String} kind The entity kind
 * @returns {Function} The get function
 */
function get (datastore, kind, namespace) {
  return function (id, cb) {
    var keyParam = [kind, id]
    if (namespace) {
      keyParam = {
        namespace: namespace,
        path: keyParam
      }
    }
    var key = datastore.key(keyParam)

    datastore.get(key, function (err, entity) {
      if (err) return cb(err)

      return cb(null, entity || null)
    })
  }
};

/**
 * Given a datastore reference and a kind, will return a function that will save an entity.
 * The object must have an id property
 *
 * @param {Object} datastore A reference to the datastore Object
 * @param {String} kind The entity kind
 * @returns {Function} The save function
 */
function save (datastore, kind, namespace) {
  return function (data, cb) {
    console.log('saving data: ' + JSON.stringify(data, null, 2))
    var keyParam = [kind, data.id]
    if (namespace) {
      keyParam = {
        namespace: namespace,
        path: keyParam
      }
    }
    var key = datastore.key(keyParam)
    datastore.save({
      key: key,
      // @TODO: convert object to array so that we can exclude properties from indexes
      // data: [
      //   {
      //     name: 'rating',
      //     value: 10,
      //     excludeFromIndexes: true
      //   }
      // ]
      data: data
    }, cb)
  }
};

/**
 * Given a datastore reference and a kind, will return a function that will return all stored entities.
 *
 * @param {Object} datastore A reference to the datastore Object
 * @param {String} kind The entity kind
 * @returns {Function} The all function
 */
function all (datastore, kind, namespace) {
  return function (cb) {
    var query = null
    if (namespace) {
      query = datastore.createQuery(namespace, kind)
    } else {
      query = datastore.createQuery(kind)
    }

    datastore.runQuery(query, function (err, entities) {
      if (err) return cb(err)

      var list = (entities || []).map(function (entity) {
        return entity
      })

      cb(null, list)
    })
  }
}
