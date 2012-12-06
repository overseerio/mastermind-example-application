//******************************************************************************************
// Overseer.io
// usage: var overseer = require('path/to/node-overseerio')({ key: API_KEY })
//******************************************************************************************

var request = require('request')

//******************************************************************************************
// Overseerio sending
//******************************************************************************************

var Overseer = function (options) {
  if (!options.key) return false
  this._key = options.key
}

Overseer.prototype = {

    postdata: function (posturl, data, next) {
      data.key = data.key || this._key
      this._post(posturl, data, next)
    }
  // sugar for different types of requests
  , _get: function (path, data, next) { this._request('get', path, data, next) }
  , _post: function (path, data, next) { this._request('post', path, data, next) }
  , _put: function (path, data, next) { this._request('put', path, data, next) }
  , _delete: function (path, data, next) { this._request('delete', path, data, next) }

}

//******************************************************************************************
// Export
//******************************************************************************************

module.exports = Overseer
