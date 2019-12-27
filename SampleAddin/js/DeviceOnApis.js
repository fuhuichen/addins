
Vue.use(VueSweetalert2)

const axiosDefaultArgs = {
  timeout: 30000,
  withCredentials: true,
}
axiosDefaultArgs.baseURL = baseUrl.RMM
console.log("baseUrl.RMM : " + baseUrl.RMM);
const oAxios = axios.create(axiosDefaultArgs)

// Intercept request
let oRMM = {}
let aAllowMethod = []
let oGet = { 'get': [] }
let oPost = { 'post': [] }
oPost.post.push({ 'api': '/rmm/v1/sso/login' })
oPost.post.push({ 'api': '/rmm/v1/accounts/logout' })
oPost.post.push({ 'api': '/rmm/v1/devicectrl/intermittent_report' })
oPost.post.push({ 'api': '/rmm/v1/action/exec/tally' })
oPost.post.push({ 'api': '/rmm/v1/devicectrl/data' })
aAllowMethod.push(oGet)
aAllowMethod.push(oPost)

oAxios.interceptors.request.use(config => {
  if (config.url.lastIndexOf(' - ') > -1) {
    config.url = config.url.replace(/ - /g, '@2D')
  }
  if (config.url.lastIndexOf(' / ') > -1) {
    config.url = config.url.replace(/ \/ /g, '@2F')
  }

  if (config.data) {
    let strData = JSON.stringify(config.data)
    let bReplace = false
    if (strData.lastIndexOf(' - ') > -1) {
      strData = strData.replace(/ - /g, '@2D')
      bReplace = true
    }
    if (strData.lastIndexOf(' / ') > -1) {
      strData = strData.replace(/ \/ /g, '@2F')
      bReplace = true
    }
    if (bReplace) { config.data = JSON.parse(strData) }
  }

  if ((config.method === 'post') && (config.url.lastIndexOf('packagecontrol/package') > -1)) {
    config.timeout = 0
  }

  oRMM = RMMGlobal.get()
  let cmd = {}
  if (oRMM.demo) {
    let bAllowMethod = false
    let bAllowAPIs = false
    let aAPIs = []
    for (let i = 0; i < aAllowMethod.length; i++) {
      if (aAllowMethod[i].hasOwnProperty(config.method)) {
        bAllowMethod = true
        aAPIs = aAllowMethod[i][config.method]
        break
      }
    }

    if (aAPIs.length === 0) {
      bAllowAPIs = true
    } else {
      for (let i = 0; i < aAPIs.length; i++) {
        if (aAPIs[i].api === config.url.substring(config.baseURL.length)) {
          bAllowAPIs = true
          break
        }
      }
    }

    if (bAllowMethod && bAllowAPIs) {
      return config
    } else {
      cmd = {
        type: 'ajax',
        value: 'deviceon.product.demouser',
        reLogin: false
      }
      window.parent.postMessage(cmd, window.origin)
      return Promise.reject
    }
  } else {
    if (config.url.indexOf('/static/') > 0) {
      let aURL = config.url.split('/static/')
      config.url = '/static/' + aURL[1]
    }
    config.headers['Accept-Language'] = 'en-US'
    return config
  }
}, err => {
  let cmd = {
    type: 'ajax',
    value: 'deviceon.message.warnings.408',
    reLogin: false
  }
  window.parent.postMessage(cmd, window.origin)
  return Promise.reject(err)
})

// Intercept response
oAxios.interceptors.response.use(
  response => {
    let strData = JSON.stringify(response.data)
    if ((strData.indexOf('@2D') > -1) || (strData.indexOf('@2F') > -1)) {
      strData = strData.replace(/@2D/g, ' - ')
      strData = strData.replace(/@2F/g, ' / ')
      response.data = JSON.parse(strData)
    }
    return response
  },
  err => {
    let cmd = {}
    if (err.response) {
      switch (err.response.status) {
        // case 400: //Test
        case 405:
          let bExpired = false
          try {
            if ((err.response.data.ErrorCode !== '') && (err.response.data.Description !== '')) {
              bExpired = (err.response.data.ErrorCode === '1009')
            } else {
              bExpired = false
            }
          } catch (e) {
            bExpired = false
          }
          // bExpired = true //Test
          if (bExpired) {
            cmd = {
              type: 'ajax',
              value: 'deviceon.message.warnings.1009',
            }
            window.parent.postMessage(cmd, window.origin)
          }
          break
        // case 401:
        //   let aExclude = ['myself', 'login']
        //   let strURL = err.config.url.split('?')[0]
        //   let aURL = strURL.split('/')
        //   if (aExclude.indexOf(aURL[aURL.length - 1]) === -1) {
        //     cmd = {
        //       type: 'ajax',
        //       value: 'deviceon.message.warnings.401',
        //       reLogin: true
        //     }
        //     window.parent.postMessage(cmd, window.origin)
        //   }
        //   break
        case 503:
          if (err.response.statusText === 'Service Unavailable') {
            cmd = {
              type: 'ajax',
              value: 'deviceon.message.warnings.503',
            }
            window.parent.postMessage(cmd, window.origin)
          }
          break
        case 1353:
          if (err.response.statusText === 'Mail Server Configuration Error') {
            cmd = {
              type: 'ajax',
              value: 'deviceon.message.warnings.1353',
            }
            window.parent.postMessage(cmd, window.origin)
          }
          break
        case 408:
          cmd = {
            type: 'ajax',
            value: 'deviceon.message.warnings.408',
          }
          window.parent.postMessage(cmd, window.origin)
          // if (err.response.statusText === 'Mail Server Configuration Error') {
          //   cmd = {
          //     type: 'ajax',
          //     value: 'deviceon.message.warnings.408',
          //   }
          //   window.parent.postMessage(cmd, window.origin)
          // }
          break
        case 404:
          if (err.response.data.FieldValue === 'format error') {
            cmd = {
              type: 'ajax',
              value: 'deviceon.device.message.formatError',
            }
            window.parent.postMessage(cmd, window.origin)
          } else if (err.response.statusText === 'Not Found') {
            cmd = {
              type: 'ajax',
              value: 'deviceon.message.warnings.40402',
            }
            window.parent.postMessage(cmd, window.origin)
          }
          break
        default:
          break
      }
      return Promise.reject(err)
    } else {
      return Promise.reject(err)
    }
  }
)

const DeviceOnApis = {
  MessageBox: {
    Error: function (obj, error) {
      let strIcon = 'error'
      let strTitle = obj.$t('deviceon.message.error')
      let strMessage = obj.$t('deviceon.message.error')
      try {
        if (typeof error.message !== 'undefined') strMessage = error.message
      } catch (e) { }
      try {
        if (typeof error.response.data.message !== 'undefined') strMessage = error.response.data.message
      } catch (e) { }
      try {
        if (typeof error.response.data.ErrorDetail !== 'undefined') strMessage = error.response.data.ErrorDetail
      } catch (e) { }
      try {
        if (typeof error.response.data.Description !== 'undefined') strMessage = error.response.data.Description
      } catch (e) { }
      try {
        if (typeof error.response.data.ErrorCode !== 'undefined') {
          let aField = error.response.data.Field.split('/')
          let aFieldValue = error.response.data.FieldValue.split('/')
          let strField = aField[aField.length - 1]
          let strFieldValue = aFieldValue[aFieldValue.length - 1]
          switch (error.response.data.ErrorCode) {
            case '1001':
              strMessage = strField + ' : ' + strFieldValue
              break
            case '1303':
              strIcon = 'warning'
              strTitle = obj.$t('deviceon.message.warning')
              strMessage = obj.$t('deviceon.message.errors.1303', { field: strField, fieldvalue: strFieldValue })
              break
            default:
              if (error.response.data.FieldValue !== '') { strMessage = strMessage + ' - ' + error.response.data.Field + ' : ' + error.response.data.FieldValue }
              break
          }
        }
      } catch (e) { }

      return obj.$swal({
        title: strTitle,
        text: strMessage,
        icon: strIcon,
        type: strIcon,
        confirmButtonText: obj.$t('modal.confirm'),
        cancelButtonText: obj.$t('modal.cancel'),
      })
    },
    Normal: function (obj, strTitle, strText, strIcon, showCancelBtn) {
      return obj.$swal({
        title: strTitle,
        text: strText,
        icon: strIcon,
        type: strIcon,
        confirmButtonText: obj.$t('modal.confirm'),
        cancelButtonText: obj.$t('modal.cancel'),
        showCancelButton: showCancelBtn
      })
    },
    HTML: function (obj, strTitle, strText, strIcon, showCancelBtn) {
      return obj.$swal({
        title: strTitle,
        html: strText,
        icon: strIcon,
        type: strIcon,
        confirmButtonText: obj.$t('modal.confirm'),
        cancelButtonText: obj.$t('modal.cancel'),
        buttons: showCancelBtn
      })
    }
  },
  roles: {
    get: {
      roles: function (pageSize, no, orderBy, orderType, like, others) {
        let api = '/rmm/v1/roles'
        let oData = { pageSize: pageSize, no: no, orderBy: orderBy, orderType: orderType, like: like }
        return oAxios.get(api, { params: oData })
      },
      role: function (rid, others) {
        let api = '/rmm/v1/roles/' + rid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      rolePrivileges: function (rid, others) {
        let api = '/rmm/v1/roles/' + rid + '/privileges'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      accounts: function (rid, parameters, others) {
        let api = '/rmm/v1/roles/' + rid + '/accounts?'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      }
    }
  },
  accounts: {
    get: {
      myself: function (aid, others) {
        let api = '/rmm/v1/accounts/myself'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      login: function (username, password, others) {
        const url = '/rmm/v1/accounts/login'
        const params = {}
        if (username && password) {
          params.auth = {
            username,
            password,
          }
        }
        const ret = oAxios.get(url, params)
        return ret
        /* let url = '/rmm/v1/accounts/login'
        let oData = {url, auth:{username, password}}
        return oAxios.get(url, { params: oData }) */
      },
      account: function (aid, others) {
        let api = '/rmm/v1/accounts/' + aid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      accounts: function (others) {
        let api = '/rmm/v1/accounts?pageSize=1000&no=1&orderBy=aid&orderType=asc&like='
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      allAccounts: function (others) {
        let api = '/rmm/v1/accounts/groups/basics'
        return oAxios.get(api)
      },
      deviceGroups: function (accountId, others) {
        let api = '/rmm/v1/accounts/' + accountId + '/groups'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      allGroups: function (accountId, others) {
        let api = '/rmm/v1/accounts/groups/basics'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      validity: function (others) {
        let api = '/rmm/v1/accounts/token/validity'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
    },
    post: {
      account: function (data, others) {
        let api = '/rmm/v1/accounts'
        let oData = data
        return oAxios.post(api, oData)
      },
      logout: function (data, others) {
        let api = '/rmm/v1/accounts/logout'
        let oData = data
        return oAxios.post(api, oData)
      },
      signup: function (data, others) {
        let api = '/rmm/v1/accounts/signup'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      accounts: function (data, others) {
        let api = '/rmm/v1/accounts'
        let oData = data
        return oAxios.put(api, oData)
      }
    },
    patch: {
      password: function (data, others) {
        let api = '/rmm/v1/accounts/myself/password'
        let oData = data
        return oAxios.patch(api, oData)
      },
      accountPrivileges: function (data, others) {
        let api = '/rmm/v1/accounts/privileges'
        let oData = data
        return oAxios.patch(api, oData)
      },
      accountTrial: function (data, others) {
        let api = '/rmm/v1/accounts/trial'
        let oData = data
        return oAxios.patch(api, oData)
      },
      accountTrialDays: function (data, others) {
        let api = '/rmm/v1/accounts/trial/days'
        let oData = data
        return oAxios.patch(api, oData)
      }
    },
    delete: {
      account: function (aid, others) {
        let api = '/rmm/v1/accounts/' + aid
        return oAxios.delete(api)
      },
      resetPassword: function (userEmail, others) {
        let api = '/rmm/v1/accounts/password?mail=' + userEmail
        return oAxios.delete(api)
      }
    }
  },
  devicegroups: {
    get: {
      deviceGroups: function (others) {
        let api = '/rmm/v1/devicegroups'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      deviceGroup: function (gid, others) {
        let api = '/rmm/v1/devicegroups/' + gid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      devices: function (gid, parameters, others) {
        let api = '/rmm/v1/devicegroups/' + gid + '/devices'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      },
      devicesAll: function (parameters, others) {
        let api = '/rmm/v1/devicegroups/devices'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      deviceGroup: function (data, others) {
        let api = '/rmm/v1/devicegroups/'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      deviceGroups: function (data, others) {
        let api = '/rmm/v1/devicegroups/'
        let oData = data
        return oAxios.put(api, oData)
      }
    },
    delete: {
      deviceGroup: function (gid, others) {
        let api = '/rmm/v1/devicegroups/' + gid
        return oAxios.delete(api)
      }
    }
  },
  devices: {
    get: {
      device: function (did, others) {
        let api = '/rmm/v1/devices/' + did
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      belongings: function (agentId, others) {
        let api = '/rmm/v1/devices/belongings?agentId=' + agentId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      unassignedDevices: function (parameters, others) {
        let api = '/rmm/v1/devices/unassigned?'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      },
      unassignedDevice: function (agentId, others) {
        let api = '/rmm/v1/devices/unassigned/device?agentId=' + agentId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      devicePlugins: function (did, current, others) {
        let api = '/rmm/v1/devices/' + did + '/plugins?current=' + current
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      devicePluginSensors: function (did, plugin, parameters, others) {
        let api = '/rmm/v1/devices/' + did + '/' + plugin + '/sensors?'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      },
      connectivity: function (parameters, others) {
        let api = '/rmm/v1/devices/connectivity'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      },
      statusNumber: function (parameters, others) {
        let api = '/rmm/v1/devices/own/status/number'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      },
      unassignedNumber: function (others) {
        let api = '/rmm/v1/devices/unassigned/number'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      deviceAgentId: function (agentId, others) {
        let api = '/rmm/v1/devices?agentId=' + agentId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      devicesTop: function (topN, topType, others) {
        let api = '/rmm/v1/devices/topn?n=' + topN + '&data=' + topType // cpu|memory|nerwork|disk|disconnect
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
    },
    put: {
      devices: function (data, others) {
        let api = '/rmm/v1/devices'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceWOL: function (data, others) {
        let api = '/rmm/v1/devices/wol'
        let oData = data
        return oAxios.put(api, oData)
      }
    },
    patch: {
      name: function (agentId, data, others) {
        let api = '/rmm/v1/devices/name/' + agentId
        let oData = data
        return oAxios.patch(api, oData)
      },
      deviceGroups: function (data, others) {
        let api = '/rmm/v1/devices'
        let oData = data
        return oAxios.patch(api, oData)
      },
      coordinates: function (data, others) {
        let api = '/rmm/v1/devices/coordinates'
        let oData = data
        return oAxios.patch(api, oData)
      },
      grafana: function (data, others) {
        let api = '/rmm/v1/devices/grafana/templates'
        let oData = data
        return oAxios.patch(api, oData)
      }
    }
  },
  notifymgmt: {
    get: {
      notifications: function (type, severity, category, others) {
        var ajaxUrl = '/rmm/v1/notifymgmt?type=' + type
        if (severity !== 'All') { ajaxUrl += '&severity=' + severity }
        if (category !== 'All') { ajaxUrl += '&category=' + category }

        let api = ajaxUrl
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      notificationCategories: function (type, severity, language, others) {
        var params = {}
        if (type) { params.type = type }
        if (severity !== 'All') { params.severity = severity }
        if (language) { params.language = language }

        let api = '/rmm/v1/notifymgmt/category'
        let oData = params
        return oAxios.get(api, { params: oData })
      },
      notificationBind: function () {
        var params = {}
        let api = '/rmm/v1/notifymgmt/bind'
        let oData = params
        return oAxios.get(api, { params: oData })
      },
    },
    post: {
      customizedNotification: function (data, others) {
        let api = '/rmm/v1/notifymgmt/customize'
        let oData = data
        return oAxios.post(api, oData)
      },
      bindNotification: function (data, others) {
        let api = '/rmm/v1/notifymgmt/bind'
        let oData = data
        return oAxios.post(api, oData)
      },
      sendEmail: function (data, others) {
        let api = '/rmm/v1/notifymgmt/send_email'
        let oData = data
        return oAxios.post(api, oData)
      },
      sendSMS: function (data, others) {
        let api = '/rmm/v1/notifymgmt/send_sms'
        let oData = data
        return oAxios.post(api, oData)
      },
      send_sms_2016: function (data, others) {
        let api = '/rmm/v1/notifymgmt/send_sms_2016'
        let oData = data
        return oAxios.post(api, oData)
      },
      sendLINE: function (data, others) {
        let api = '/rmm/v1/notifymgmt/send_line'
        let oData = data
        return oAxios.post(api, oData)
      },
      sendWechat: function (data, others) {
        let api = '/rmm/v1/notifymgmt/send_wechat'
        let oData = data
        return oAxios.post(api, oData)
      },
      sendWhatsapp: function (data, others) {
        let api = '/rmm/v1/notifymgmt/send_whatsapp'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      customizedNotifications: function (data, others) {
        let api = '/rmm/v1/notifymgmt/customize'
        let oData = data
        return oAxios.put(api, oData)
      },
      notifications: function (data, others) {
        let api = '/rmm/v1/notifymgmt'
        let oData = data
        return oAxios.put(api, oData)
      }
    },
    delete: {
      customizedNotification: function (eid, others) {
        let api = '/rmm/v1/notifymgmt/customize?eid=' + eid
        return oAxios.delete(api)
      },
      bindNotification: function (eid, others) {
        let api = '/rmm/v1/notifymgmt/bind?eid=' + eid
        return oAxios.delete(api)
      },
    }
  },
  events: {
    get: {
      events: function (accountId, groupId, eventType, severity, category, beginTs, endTs, orderBy, orderType, like, forExport, others) {
        let url, language
        let currentLanguage = RMMGlobal.currentLanguage()
        if (currentLanguage) {
          if (currentLanguage === 'zh-TW') { language = 'zh-TW' } else if (currentLanguage === 'zh-CN') { language = 'zh-CN' } else { language = 'en-US' }
        } else {
          language = 'en-US'
        }
        if (eventType.toLowerCase() === 'device') {
          url = '/rmm/v1/events/devices?' + 'severity=' + severity + '&accountId=' + accountId + '&groupId=' + groupId + '&beginTs=' + beginTs + '&endTs=' + endTs + '&orderBy=' + orderBy + '&orderType=' + orderType + '&language=' + language
        } else if (eventType.toLowerCase() === 'operation') {
          if (groupId) { url = '/rmm/v1/events/operation?' + 'severity=' + severity + '&accountId=' + accountId + '&groupId=' + groupId + '&beginTs=' + beginTs + '&endTs=' + endTs + '&orderBy=' + orderBy + '&orderType=' + orderType + '&language=' + language } else { url = '/rmm/v1/events/operation?' + 'severity=' + severity + '&accountId=' + accountId + '&beginTs=' + beginTs + '&endTs=' + endTs + '&orderBy=' + orderBy + '&orderType=' + orderType + '&language=' + language }
        } else if (eventType.toLowerCase() === 'system') {
          if (groupId) { url = '/rmm/v1/events/system?' + 'severity=' + severity + '&accountId=' + accountId + '&groupId=' + groupId + '&beginTs=' + beginTs + '&orderBy=' + orderBy + '&endTs=' + endTs + '&orderType=' + orderType + '&language=' + language } else { url = '/rmm/v1/events/system?' + 'severity=' + severity + '&accountId=' + accountId + '&beginTs=' + beginTs + '&endTs=' + endTs + '&orderBy=' + orderBy + '&orderType=' + orderType + '&language=' + language }
        }

        if (category !== 'All') { url += '&category=' + category }

        if (like !== '') {
          url += '&like_field=message%7Cagent_name%7Cseverity%7Csubtype'
          url += '&like_condition=' + like
        }

        if (forExport) { url += '&amount=10000' } else { url += '&amount=20' }

        let api = url
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      deviceEvents: function (agentId, groupId, eventType, severity, category, beginTs, endTs, orderType, others) {
        let language
        let currentLanguage = RMMGlobal.currentLanguage()
        if (currentLanguage) {
          if (currentLanguage === 'zh-TW') { language = 'zh-TW' } else if (currentLanguage === 'zh-CN') { language = 'zh-CN' } else { language = 'en-US' }
        }

        var url = '/rmm/v1/events/devices?' + 'severity=' + severity + '&agentId=' + agentId + '&beginTs=' + beginTs + '&endTs=' + endTs + '&orderType=' + orderType + '&language=' + language + '&amount=10000'

        if (category !== 'All') { url += '&category=' + category }

        let api = url
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    delete: {
      events: function (type, dateTime, timeZone, others) {
        let api = '/rmm/v1/events?type=' + type + '&dateTime=' + dateTime + '&timeZone=' + timeZone
        return oAxios.delete(api)
      }
    }
  },
  settings: {
    get: {
      setting: async function (service, others) {
        let api = '/rmm/v1/settings?type=' + service + '&_=' + new Date().getTime()
        let oData = {}
        let res = await oAxios.get(api, { params: oData })
        return res
      },
      settings: async function (others) {
        let api = '/rmm/v1/settings'
        let res = await oAxios.get(api)
        return res
      },
      pluginListByDevice: async function (agentId, others) {
        let api = '/rmm/v1/data/devices/sensorinfos?agentId=' + agentId
        let res = await oAxios.get(api)
        return res
      },
      pluginListByGroup: async function (gid, others) {
        let api = '/rmm/v1/data/groups/sensorinfos?gid=' + gid
        let res = await oAxios.get(api)
        return res
      },
      ruleSensor: async function (did, pluginName, others) {
        let api = '/rmm/v1/devices/' + did + '/' + pluginName + '/sensors'
        let res = await oAxios.get(api)
        return res
      },
      ruleCapability: async function (did, language, others) {
        let api = '/rmm/v1/data/devices/' + did + '/capability?&language=' + language
        let res = await oAxios.get(api)
        return res
      },
      currentValue: async function (did, agentId, pluginName, sensorId, others) {
        let api = '/rmm/v1/devicectrl/devices/' + did + '/data?agentId=' + agentId + '&plugin=' + pluginName + '&sensorId=' + sensorId
        let res = await oAxios.get(api)
        return res
      },
      ruleList: async function (type, others) {
        let api = '/rmm/v1/rules?type=' + type
        let res = await oAxios.get(api)
        return res
      }
    },
    post: {
      setDeviceRule: function (data, others) {
        let api = '/rmm/v1/rules/device/'
        let oData = data
        return oAxios.post(api, oData)
      },
      setGroupRule: function (data, others) {
        let api = '/rmm/v1/rules/group/'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      settings: async function (data, others) {
        let api = '/rmm/v1/settings'
        let oData = data
        let res = await oAxios.put(api, oData)
        return res
      },
      updateDeviceRule: function (data, others) {
        let api = '/rmm/v1/rules/device/'
        let oData = data
        return oAxios.put(api, oData)
      },
      updateGroupRule: function (data, others) {
        let api = '/rmm/v1/rules/group/'
        let oData = data
        return oAxios.put(api, oData)
      }
    },
    delete: {
      rule: async function (ruleId, others) {
        let api = '/rmm/v1/rules/' + ruleId
        let res = await oAxios.delete(api)
        return res
      }
    }
  },
  system: {
    get: {
      system: function (others) {
        let api = '/rmm/v1/system'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      iscfapp: function (others) {
        let api = '/rmm/v1/system/iscfapp'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      checkIsOffline: function (others) {
        let api = '/rmm/v1/system/activate/connectionTest'
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      activateServer: function (data, others) {
        let api = '/rmm/v1/system/activate'
        let oData = data
        return oAxios.post(api, oData)
      },
      trialExtend: function (data, others) {
        let api = '/rmm/v1/system/trialExtend'
        let oData = data
        return oAxios.post(api, oData)
      }
    }
  },
  mp: {
    post: {
      serviceKeys: function (data, others) {
        let api = '/rmm/v1/mp/service_keys'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      serviceKeys: function (data, serviceKeyGuid, others) {
        let api = '/rmm/v1/mp/service_keys/' + serviceKeyGuid
        let oData = data
        return oAxios.put(api, oData)
      }
    }
  },
  sso: {
    get: {
      users: function (others) {
        let api = '/rmm/v1/sso/users/'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      logout: function (others) {
        let api = '/rmm/v1/sso/logout?redirectUri=' + window.location.origin
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      resetPassword: function (userEmail, others) {
        let api = '/rmm/v1/sso/users/' + userEmail + '/pwdresetemail'
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      login: function (data, others) {
        let api = '/rmm/v1/sso/login'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    patch: {
      userScope: function (userEmail, data, others) {
        let api = '/rmm/v1/sso/users/' + userEmail + '/scopes'
        let oData = data
        return oAxios.patch(api, oData)
      },
      activation: function (username, activationCode, newPasswd, others) {
        let api = '/rmm/v1/sso/activation/users/' + username + '/password?activationCode=' + activationCode
        let oData = { new_password: newPasswd }
        return oAxios.patch(api, oData)
      },
      changePassword: function (userEmail, data, others) {
        let api = '/rmm/v1/sso/users/' + userEmail + '/password'
        let oData = data
        return oAxios.patch(api, oData)
      },
    }
  },
  scheduleControl: {
    get: {
      allschedule: function (parameters, others) {
        let api = '/rmm/schedulecontrol/all/schedule?'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      }
    },
    delete: {
      scheduleByGid: function (gid, pkgType, actType, others) {
        let api = '/rmm/schedulecontrol/group/' + gid + '/schedule?pkgType=' + pkgType + '&actType=' + actType
        return oAxios.delete(api)
      },
      scheduleByDid: function (did, pkgType, actType, others) {
        let api = '/rmm/schedulecontrol/schedule?agentIds=' + did + '&pkgType=' + pkgType + '&actType=' + actType
        return oAxios.delete(api)
      }
    }
  },
  schedules: {
    get: {
      schedule: function (sid, others) {
        let api = '/rmm/v1/schedules/' + sid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      schedules: function (parameters, others) {
        let api = '/rmm/v1/schedules'
        let oData = parameters
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      device: function (data, others) {
        let api = '/rmm/v1/schedules/devices/'
        let oData = data
        return oAxios.post(api, oData)
      },
      deviceGroup: function (data, others) {
        let api = '/rmm/v1/schedules/groups/'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      device: function (data, others) {
        let api = '/rmm/v1/schedules/devices/'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceGroup: function (data, others) {
        let api = '/rmm/v1/schedules/groups/'
        let oData = data
        return oAxios.put(api, oData)
      }
    },
    delete: {
      schedule: function (sid, others) {
        let api = '/rmm/v1/schedules/' + sid
        return oAxios.delete(api)
      }
    }
  },
  protection: {
    get: {
      accountsGroupDevice: function (aid) {
        let api = '/rmm/v1/protection/groups/account/' + aid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      deviceGroups: function (gid, others) {
        let api = '/rmm/v1/protection/groups/' + gid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      statusNumber: function (others) {
        let api = '/rmm/v1/protection/devices/own/status/number'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      status: function (others) {
        let api = '/rmm/v1/protection/devices/own/status'
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    put: {
      devices: function (data, others) {
        let api = '/rmm/v1/protection/device'
        let oData = data
        return oAxios.put(api, oData)
      },
      devices_sn: function (data, others) {
        let api = '/rmm/v1/protection/device_sn'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceGroups: function (data, others) {
        let api = '/rmm/v1/protection/group'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceGroups_sn: function (data, others) {
        let api = '/rmm/v1/protection/group_sn'
        let oData = data
        return oAxios.put(api, oData)
      }
    }
  },
  recovery: {
    get: {
      accountsGroupDevice: function (aid) {
        let api = '/rmm/v1/recovery/groups/account/' + aid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      deviceGroups: function (gid, others) {
        let api = '/rmm/v1/recovery/groups/' + gid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      statusNumber: function (others) {
        let api = '/rmm/v1/recovery/devices/own/status/number'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      status: function (others) {
        let api = '/rmm/v1/recovery/devices/own/status'
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    put: {
      devices: function (data, others) {
        let api = '/rmm/v1/recovery/device'
        let oData = data
        return oAxios.put(api, oData)
      },
      devices_sn: function (data, others) {
        let api = '/rmm/v1/recovery/device_sn'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceGroups: function (data, others) {
        let api = '/rmm/v1/recovery/group'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceGroups_sn: function (data, others) {
        let api = '/rmm/v1/recovery/group_sn'
        let oData = data
        return oAxios.put(api, oData)
      }
    }
  },
  power: {
    get: {
      device: function (did, others) {
        let api = '/rmm/v1/power/devices/' + did
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    put: {
      devices: function (data, others) {
        let api = '/rmm/v1/power/device'
        let oData = data
        return oAxios.put(api, oData)
      },
      deviceGroups: function (data, others) {
        let api = '/rmm/v1/power/group'
        let oData = data
        return oAxios.put(api, oData)
      }
    }
  },
  devicectrl: {
    get: {
      sensorRealTimeData: function (did, agentId, plugin, sensorId, others) {
        let api = '/rmm/v1/devicectrl/devices/data?agentId=' + agentId + '&plugin=' + plugin + '&sensorId=' + sensorId
        api = encodeURI(api)
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      sensor: function (data, others) {
        let api = '/rmm/v1/devicectrl/data'
        let oData = data
        return oAxios.post(api, oData)
      },
      periodicReport: function (data, others) {
        let api = '/rmm/v1/devicectrl/periodic_report'
        let oData = data
        return oAxios.post(api, oData)
      },
      suspendReport: function (data, others) {
        let api = '/rmm/v1/devicectrl/report_suspension'
        let oData = data
        return oAxios.post(api, oData)
      },
      intermittentReport: function (data, others) {
        let api = '/rmm/v1/devicectrl/intermittent_report'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      intermittentReport: function (data, others) {
        let api = '/rmm/v1/devicectrl/intermittent_report'
        let oData = data
        return oAxios.post(api, oData)
      }
    }
  },
  data: {
    get: {
      pluginLatestData: function (did, agentId, handler, others) {
        let api = '/rmm/v1/data/devices/' + did + '/latestdata_by_opts?agentId=' + agentId + '&plugin=' + handler
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      histdata: function (agentId, plugin, sensorId, beginTs, endTs, amount, order, others) {
        let api = '/rmm/v1/data/devices/histdata?agentId=' + agentId + '&plugin=' + plugin + '&sensorId=' + sensorId + '&beginTs=' + beginTs + '&endTs=' + endTs + '&amount=' + amount + '&order=' + order
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      capability: function (did, handler, others) {
        let api = (handler) ? '/rmm/v1/data/devices/' + did + '/capability?plugin=' + handler : '/rmm/v1/data/devices/' + did + '/capability'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
    },
    delete: {
      deviceData: function (dateTime, timeZone, others) {
        let api = '/rmm/v1/data?dateTime=' + dateTime + '&timeZone=' + timeZone
        return oAxios.delete(api)
      }
    }
  },
  screenshot: {
    get: {
      device: function (strDid, resType, others) {
        let api = '/rmm/v1/screenshot/devices/' + strDid + '?resType=' + resType
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    }
  },
  kvm: {
    post: {
      device: function (data, others) {
        let api = '/rmm/v1/kvm/'
        let oData = data
        return oAxios.post(api, oData)
      }
    }
  },
  processes: {
    post: {
      device: function (data, others) {
        let api = '/rmm/v1/processes/'
        let oData = data
        return oAxios.post(api, oData)
      }
    }
  },
  rules: {
    get: {
      deviceGroup: function (gid, others) {
        let api = '/rmm/v1/rules/groups/' + gid
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      deviceRuleMap: function (did, others) {
        let api = '/rmm/v1/rules/rulemaps/devices/' + did
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    put: {
      deviceGroups: function (data, others) {
        let api = '/rmm/v1/rules/group/'
        let oData = data
        return oAxios.put(api, oData)
      },
      devices: function (data, others) {
        let api = '/rmm/v1/rules/device/'
        let oData = data
        return oAxios.put(api, oData)
      },
      ruleMaps: function (data, others) {
        let api = '/rmm/v1/rules/rulemaps/devices'
        let oData = data
        return oAxios.put(api, oData)
      }

    },
    post: {
      deviceGroup: function (data, others) {
        let api = '/rmm/v1/rules/group/'
        let oData = data
        return oAxios.post(api, oData)
      },
      device: function (data, others) {
        let api = '/rmm/v1/rules/device/'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    delete: {
      rule: function (rid, others) {
        let api = '/rmm/v1/rules/' + rid
        return oAxios.delete(api)
      }
    }
  },
  appinfo: {
    get: {
      version: function () {
        let api = '/rmm/v1/appinfo/version'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      info: function () {
        let api = '/rmm/v1/appinfo/info?product=deviceon'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
    }
  },
  proxy: {
    get: {
      proxy: function (url, auth, others) {
        let api = '/rmm/v1/proxy?url=' + url + '&authorization=' + auth
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      proxy: function (data, others) {
        let api = '/rmm/v1/proxy'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    delete: {
      proxy: function (url, auth, others) {
        let api = '/rmm/v1/proxy?url=' + url + '&authorization=' + auth
        return oAxios.delete(api)
      }
    }
  },
  prediction: {
    get: {
      sensorReport: function (did, agentId, plugin, sensorId, others) {
        let api = '/rmm/v1/prediction/devices/data?agentId=' + agentId + '&plugin=' + plugin + '&sensorId=' + sensorId
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    }
  },
  action: {
    get: {
      actionTypes: function (language, others) {
        let api = '/rmm/v1/action/types?&language=' + language
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      actionDefined: function (language, others) {
        let api = '/rmm/v1/action/defined?&language=' + language
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      actionExex: function (others) {
        let api = '/rmm/v1/action/exec'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      actionExexCheck: function (actionId, others) {
        let api = '/rmm/v1/action/exec/check/' + actionId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      actionExexTime: function (StartTime, EndTime, others) {
        let api = '/rmm/v1/action/exec?st=' + StartTime + '&et=' + EndTime
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      scheduleList: function (StartTime, EndTime, others) {
        let api = '/rmm/v1/action/schedule?st=' + StartTime + '&et=' + EndTime
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      action: function (data, others) {
        let api = '/rmm/v1/action/defined'
        let oData = data
        return oAxios.post(api, oData)
      },
      actionExex: function (data, others) {
        let api = '/rmm/v1/action/exec/tally'
        let oData = data
        return oAxios.post(api, oData)
      },
      actionSchedule: function (data, others) {
        let api = '/rmm/v1/action/schedule'
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      action: function (data, others) {
        let api = '/rmm/v1/action/defined'
        let oData = data
        return oAxios.put(api, oData)
      },
      runAction: function (definedId, data, others) {
        let api = '/rmm/v1/action/fire/' + definedId
        let oData = data
        return oAxios.put(api, oData)
      },
      actionSchedule: function (data, others) {
        let api = '/rmm/v1/action/schedule'
        let oData = data
        return oAxios.put(api, oData)
      },
    },
    delete: {
      action: function (eid, others) {
        let api = '/rmm/v1/action/defined/' + eid
        return oAxios.delete(api)
      },
      actionSchedule: function (sid, others) {
        let api = '/rmm/v1/action/schedule/' + sid
        return oAxios.delete(api)
      }
    }
  },
  ota: {
    get: {
      fetchNorm: function () {
        let api = '/rmm/upgradecontrol/upgrader/norm'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      storage: function () {
        let api = '/rmm/storagemanager/storages'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      package: function (stgId) {
        let api = '/rmm/packagecontrol/packages'
        if (stgId) api += '?stgId=' + stgId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      fetchDelStatusCluster: function (stgId, pkgname) {
        let api = '/rmm/packagecontrol/cluster/package/deletestatus?stgId=' + stgId + '&names=' + pkgname
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      fetchFileSizeLimit: function () {
        let api = '/rmm/upgradecontrol/upgrader/norm'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      upgradeDevices: function (gid, page, searchKey) {
        const filter = { status: 'ONLINE' } // status: ALL/ONLINE/OFFLINE
        const sort = { key: 'name', order: 'ASC' }
        let api = `/rmm/otadevicemanager/group/${gid}/devices`
        api += `?searchKey=${searchKey}`
        api += `&sortKey=${sort.key}&sortType=${sort.order}`
        api += `&statusType=${filter.status}`
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      hasSoftwareInfoHandler: function (agentId) {
        let api = `/rmm/v1/devices?agentId=${agentId}`
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      listPrograms: function (agentId, deviceId) {
        let api = '/rmm/v1/data/devices'
        api += ('/' + deviceId)
        api += ('/latestdata')
        api += ('?agentId=' + agentId)
        api += ('&plugin=SoftwareInfoHandler')
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      listPackages: function (agentId, pkgOwnerId) {
        let api = '/rmm/upgradecontrol/bydevice/extantpackage'
        api += '?agentId=' + agentId + '&pkgOwnerId=' + pkgOwnerId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      listSoftwares: function (agentId) {
        let api = `/rmm/otadevicemanager/bydevice/softwares?agentId=${agentId}`
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      listSchedule: function (type, agentId, gid, actType = undefined) {
        let api = '/rmm/schedulecontrol/group/' + gid + '/somedevice/schedule?agentId=' + agentId
        if (type === 'Device') {
          api = '/rmm/schedulecontrol/group/' + gid + '/somedevice/schedule?agentId=' + agentId
        } else {
          api = '/rmm/schedulecontrol/group/' + gid + '/schedule'
        }

        if (actType) api += ('&actType=' + actType)
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      listUpgradeStatus: function (agentId, statusType) {
        let api = '/rmm/upgradecontrol/bydevice/lastfailed/upgradestatus'
        api += ('?agentId=' + agentId)
        api += ('&statusType=' + (statusType === 'ongoing' ? 'ds' : 'lfs'))
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      fetchTypeAll: function (stgId) {
        let api = '/rmm/packagecontrol/all/package/type'
        if (stgId) api += '?stgId=' + stgId
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      uploadstatus: function (stgId, pkgName, pkgOwnerId) {
        let api = '/rmm/packagecontrol/byname/package/uploadstatus'
        if (stgId) api += '?stgId=' + stgId + '&name=' + pkgName + '&pkgOwnerId=' + pkgOwnerId

        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      upgrader: function (data, others) {
        let api = '/rmm/upgradecontrol/upgrader'
        let oData = {}
        if (data.type === 'Device') {
          api = '/rmm/upgradecontrol/upgrader'
          oData.agentIds = data.agentIds
          oData.pkgName = data.pkgName
          oData.pkgOwnerId = data.pkgOwnerId
          oData.stgId = data.stgId
        } else {
          api = '/rmm/upgradecontrol/group/' + data.gid + '/upgrader'
          oData.pkgName = data.pkgName
          oData.stgId = data.stgId
        }
        return oAxios.post(api, oData)
      },
      downloader: function (data, others) {
        let api = '/rmm/upgradecontrol/downloader'
        let oData = {}
        if (data.type === 'Device') {
          api = '/rmm/upgradecontrol/downloader'
          oData.agentIds = data.agentIds
          oData.pkgName = data.pkgName
          oData.pkgOwnerId = data.pkgOwnerId
          oData.stgId = data.stgId
        } else {
          api = '/rmm/upgradecontrol/group/' + data.gid + '/downloader'
          oData.pkgName = data.pkgName
          oData.stgId = data.stgId
        }
        return oAxios.post(api, oData)
      },
      deployer: function (data, others) {
        let api = '/rmm/upgradecontrol/deployer'
        let oData = {}
        if (data.type === 'Device') {
          api = '/rmm/upgradecontrol/deployer'
          oData.agentIds = data.agentIds
          oData.pkgName = data.pkgName
          oData.pkgOwnerId = data.pkgOwnerId
          oData.stgId = data.stgId
        } else {
          api = '/rmm/upgradecontrol/group/' + data.gid + '/deployer'
          oData.pkgName = data.pkgName
          oData.stgId = data.stgId
        }
        return oAxios.post(api, oData)
      },
      setNorm: function (data, others) {
        let api = '/rmm/upgradecontrol/upgrader/norm'
        let oData = data
        return oAxios.post(api, oData)
      },
      storage: function (data, others) {
        let api = '/rmm/storagemanager/storage'
        let oData = data
        return oAxios.post(api, oData)
      },
      package: function (data, config, others) {
        let api = '/rmm/packagecontrol/package'
        let oData = data
        return oAxios.post(api, oData, config)
      },
      setupSchedule: function (type, data, gid) {
        let api = '/rmm/schedulecontrol/schedule'
        if (type === 'Group') api = `/rmm/schedulecontrol/group/${gid}/schedule`
        let oData = data
        return oAxios.post(api, oData)
      }
    },
    put: {
      storage: function (data, others) {
        let api = '/rmm/storagemanager/storage'
        let oData = data
        return oAxios.put(api, oData)
      },
    },
    delete: {
      storage: function (id, others) {
        let api = '/rmm/storagemanager/storage?storageId=' + id
        return oAxios.delete(api)
      },
      package: function (stgId, pkgname, others) {
        // let api = '/rmm/packagecontrol/byname/package?stgId=' + stgId + '&names=' + pkgname
        let api = '/rmm/packagecontrol/cluster/package?stgId=' + stgId + '&names=' + pkgname
        return oAxios.delete(api)
      },
      removePackages: function (agentId, pkgs) {
        let api = '/rmm/upgradecontrol/bydevice/extantpackage'
        let oData = {}
        oData.data = {
          agentId,
          pkgNames: pkgs,
        }
        return oAxios.delete(api, oData)
      },
      removeSchedule: function (agentIdOrGid, actType, pkgType, pkgOwnerId) {
        const isGroupMode = typeof agentIdOrGid === 'number'
        let api = '/rmm/schedulecontrol/schedule?'
        if (isGroupMode) {
          api = `/rmm/schedulecontrol/group/${agentIdOrGid}/schedule`
          let subUrl = ''
          if (pkgType) {
            subUrl = '?' + 'pkgType=' + pkgType
          }
          if (actType) {
            if (subUrl.length === 0) {
              subUrl = '?' + 'actType=' + actType
            } else {
              subUrl += '&' + 'actType=' + actType
            }
          }
          api += subUrl
        } else {
          api += 'agentIds=' + agentIdOrGid
          if (pkgType) { api += '&' + 'pkgType=' + pkgType }
          if (actType) { api += '&' + 'actType=' + actType }
          if (pkgOwnerId) { api += '&' + 'pkgOwnerId=' + pkgOwnerId }
        }
        return oAxios.delete(api)
      },
    }
  },
  file: {
    get: {
      localFile: function (strFile) {
        let api = strFile
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
    }
  },
  ui: {
    get: {
      system: function (others) {
        let api = '/rmm/v1/ui-config/system'
        let oData = {}
        return oAxios.get(api, { params: oData })
      },
      my: function (others) {
        let api = '/rmm/v1/ui-config/my'
        let oData = {}
        return oAxios.get(api, { params: oData })
      }
    },
    post: {
      system: function (data, others) {
        let api = '/rmm/v1/ui-config/system'
        let oData = data
        return oAxios.post(api, oData)
      },
      my: function (data, others) {
        let api = '/rmm/v1/ui-config/my'
        return oAxios.post(api, { params: data })
      }
    }
  }
}
