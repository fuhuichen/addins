const axiosDefaultArgs2 = {
  timeout: 30000,
  withCredentials: false,
  baseURL: 'http://13.76.225.121:6183'
}
const oAxios2 = axios.create(axiosDefaultArgs2);

const TestAPI = {
  accounts: {
    post: {
      account: function () {
        let api = '/deviceons/api/account/myself';
        let oData = {};
        return oAxios2.post(api, oData);
      }
    }
  },
  device: {
    post: {
      list: function () {
        let api = '/deviceons/api/devicelist';
        let oData = {};
        return oAxios2.post(api, oData);
      },
      history: function () {
        let api = '/deviceons/api/history';
        let oData = {};
        return oAxios2.post(api, oData);
      },
      detail: function (agentId) {
        let api = '/deviceons/api/device/detail';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      processlist: function (agentId) {
        let api = '/deviceons/api/device/process/list';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      usblist: function (agentId) {
        let api = '/deviceons/api/device/usb/list';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      servicelist: function (agentId) {
        let api = '/deviceons/api/device/service/list';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      monitorlist: function (agentId) {
        let api = '/deviceons/api/device/monitor/list';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      printerlist: function (agentId) {
        let api = '/deviceons/api/device/printer/list';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      processInfo: function (agentId) {
        let api = '/deviceons/api/device/processInfo';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      HDDInfo: function (agentId) {
        let api = '/deviceons/api/device/HDDInfo';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      netInfo: function (agentId) {
        let api = '/deviceons/api/device/netInfo';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      usbUpdate: function (agentId,itemList) {
        let api = '/deviceons/api/device/usbrecord/update';
        let oData = {agentId: agentId, itemList: itemList};
        return oAxios2.post(api, oData);
      },
      printerUpdate: function (agentId,itemList) {
        let api = '/deviceons/api/device/printerrecord/update';
        let oData = {agentId: agentId, itemList: itemList};
        return oAxios2.post(api, oData);
      },
      processUpdate: function (agentId,itemList) {
        let api = '/deviceons/api/device/processrecord/update';
        let oData = {agentId: agentId, itemList: itemList};
        return oAxios2.post(api, oData);
      },
      monitorUpdate: function (agentId,itemList) {
        let api = '/deviceons/api/device/monitorrecord/update';
        let oData = {agentId: agentId, itemList: itemList};
        return oAxios2.post(api, oData);
      },
      usbFind: function (agentId) {
        let api = '/deviceons/api/usbrecord/find';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      printerFind: function (agentId) {
        let api = '/deviceons/api/printerrecord/find';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      processFind: function (agentId) {
        let api = '/deviceons/api/processrecord/find';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
      monitorFind: function (agentId) {
        let api = '/deviceons/api/monitorrecord/find';
        let oData = {agentId: agentId};
        return oAxios2.post(api, oData);
      },
    }
  }
}
