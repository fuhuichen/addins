let baseUrl = {
  //RMM: 'https://portal-deviceon-develop.wise-paas.com',
  RMM: 'http://127.0.0.1:8080',
}

// let baseUrl;
// if (process.env.NODE_ENV === 'development') {
//   baseUrl = {
//     RMM: 'https://portal-deviceon-develop.wise-paas.com',
//   }
// } else {
//   baseUrl = {
//     RMM: window.location.origin,
//   }
// }

let _Language = {
  'gb': 'en-US',
  'en': 'en-US',
  'tw': 'zh-TW',
  'cn': 'zh-CN',
}

let _gWS = null
class RMMGlobal {
  static get () {
    let oRMM = {}
    if (typeof (Storage) !== 'undefined') {
      if (typeof (localStorage.RMMGlobal) !== 'undefined') {
        oRMM = JSON.parse(localStorage.RMMGlobal)
      } else {
        localStorage.setItem('RMMGlobal', JSON.stringify(oRMM))
      }
    }
    return oRMM
  }

  static set (value) {
    let bRet = true
    if (typeof value === 'object') {
      if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('RMMGlobal', JSON.stringify(value))
      }
    } else {
      bRet = false
    }
    return bRet
  };

  static startEventListen (locale) {
    if (_gWS !== null) this.stopEventListen()

    let strURL = baseURL.RMM.split('//')[1]
    if (baseURL.RMM.split('//')[0].toLowerCase() === 'http:') { strURL = 'ws://' + strURL + '/event/' + _Language[locale] + '/-1' } else { strURL = 'wss://' + strURL + '/event/' + _Language[locale] + '/-1' }

    _gWS = new WebSocket(strURL)
    _gWS.onopen = function (evt) {
      // console.log('WebSocket Connection open ...')
    }
    _gWS.onmessage = function (evt) {
      // console.log('WebSocket Received Message: ' + evt.data)
      let oData = JSON.parse(evt.data)
      var cmd = {
        type: 'EVents',
        value: oData.events,
      }
      window.parent.postMessage(cmd, window.origin)
    }
    _gWS.onclose = function (evt) {
      console.log('WebSocket Connection closed.')
    }
  };

  static stopEventListen () {
    try {
      _gWS.close()
    } catch (e) {};
  };

  static currentLanguage () {
    return _Language[Vue.i18n.locale()]
  };
}
