//******************************************************************
// Overseer.io
// usage: var overseer = require('path/to/node-overseerio')({ key: API_KEY })
//******************************************************************

var request = require('request')

//******************************************************************
// Overseerio sending
//******************************************************************

function Overseer(options) {
  this._key = options.key
}

Overseer.prototype = {
    widget: function (widgetName) {
      if (!this._widgets[widgetName])
        this._widgets[widgetName] = new Widget(this, widgetName)

      return this._widgets[widgetName]
    }
  , _widgets: {}
  , _userCode: null
  , _request: function (method, path, data, next) {
    data.key = data.key || this._key
    
    request({
        method: method
      , form: data
      , uri: 'http://overseer.io' + path
      }, function (err, resp, body) {
        if (err || !body) next(err)
        else if (next) next(false, body)
      })
    }
  // sugar for different types of requests
  , _get: function (path, data, next) { this._request('get', path, data, next) }
  , _post: function (path, data, next) { this._request('post', path, data, next) }
  , _put: function (path, data, next) { this._request('put', path, data, next) }
  , _delete: function (path, data, next) { this._request('delete', path, data, next) }
  , _getUserCode: function (next) {
      var self = this
      if (self._userCode) {
        next(false, self._userCode)
      } else {
        self._get('/api/users', { key: self._key }, function (err, user) {
          self._userCode = JSON.parse(user).code
          next(err, self._userCode)
        })
      }
    }
  , _getPostUrl: function (widgetName, next) {
      var self = this
      this._getUserCode(function (err, userCode) {
        if (err) return next(err)
        self._get('/api/users/' + userCode + '/widgets', {}, function (err, widgets) {
          if (err) next(err)
          var widgetList = JSON.parse(widgets)
          for (var i = 0; i < widgetList.length; i++) {
            if (widgetList[i].name == widgetName) {
              // only gets ONE widget of that name, this will be an issue if your
              // widgets are not named uniquely
              return next(false, widgetList[i].code)
            }
          }
        })
      })
    }
}

var Widget = function (overseer, name) {
  if (!name) return false
  this._name = name
  this._overseer = overseer
}

Widget.prototype = {
    _dirty: false
  , _code: null
  , _path: function () {
      if (!this._code) return null
      else return '/data/' + this._code
    }
  , post: function (data, next) {
      var self = this
      if (self._code) { 
        self._post(self._path(), data, next) 
      } else {
        self._setPostUrl(function (err) {
          if (err) {
            throw err
          }
          self._post(self._path(), data, next)
        })
      }
    }
  , _post: function (posturl, data, next) {
      //if error, requery and set cache
      var self = this
      this._overseer._post(posturl, data, function (err) {
        if (err && !self._dirty) { 
          self._code = null
          self._dirty = true
          self.post(data, next)
        } else if (err) {
          throw err
        } else {
          self._dirty = false
          next()
        }
      })
    }
  , _setPostUrl: function (next) {
      var self = this
      self._overseer._getPostUrl(self._name, function (err, code) {
        if (err) { 
          throw err
        } else if (!code) {
          self._code = null
          next(new Error("Specified widget doesn't exist: " + self._name))
        } else {
          self._code = code
          next()
        }
      })
    }
}

//******************************************************************
// Export
//******************************************************************

function overseer (options) {
  if (!options.key) return false
  var o = new Overseer(options)
  return o
}

module.exports = overseer
