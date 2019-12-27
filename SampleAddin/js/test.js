var request = require('request');

var headers = {
    'Authorization':'Basic cm9vdEBhZHZhbnRlY2guY29tLnR3OjFxYXpAV1NY'
}
//var dd = '?agentId=00000001-0000-0000-0000-000BABC55FDF&plugin=EdgeX&sensorId=/monitor/enum'
//var address  = 'http://127.0.0.1:9759'
var address  = 'http://172.22.20.97:80'
function callAPI(api ,qs ){
  var url  =address + api ;
request.post(
  url,
  { json: qs ,
      timeout: 60000},
    function (error, response, body) {
        console.log(error)
        console.log(JSON.stringify(body))
    }
);
}
//http://127.0.0.1/rmm/v1/devicegroups/1/devices?pageSize=10000&no=1

callAPI('/deviceons/api/devicelist',{})
callAPI('/deviceons/api/account/myself',{})
callAPI('/deviceons/api/device/process/list',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
callAPI('/deviceons/api/device/usb/list',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
callAPI('/deviceons/api/device/service/list',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
callAPI('/deviceons/api/device/monitor/list',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
callAPI('/deviceons/api/device/processInfo',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
callAPI('/deviceons/api/device/HDDInfo',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
callAPI('/deviceons/api/device/netInfo',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})

callAPI('/deviceons/api/device/printer/list',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})



callAPI('/deviceons/api/device/usbrecord/update',{'agentId':'00000001-0000-0000-0000-000BABC55FDF',
itemList:[{"Path":"USB\\VID_04B8&PID_0E11\\535351460280500000","VID":"04B8","PID":"0E11","Name":"USBPrintingSupport"},
{"Path":"FAKEUSB\\VID_04B8&PID_0E11\\535351460280500000","VID":"0444","PID":"0911","Name":"USBPrintingSupport"}]})


callAPI('/deviceons/api/device/usbrecord/find',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})


callAPI('/deviceons/api/device/printerrecord/update',{'agentId':'00000001-0000-0000-0000-000BABC55FDF',
itemList:["WP-K851","UNKNOWN"]})
callAPI('/deviceons/api/device/printerrecord/find',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})


callAPI('/deviceons/api/device/processrecord/update',{'agentId':'00000001-0000-0000-0000-000BABC55FDF',
itemList:["chrome.exe","UevAgentService","TESTSERVICE","UnistoreSvc_2dfa3","FontCache3.0.0.0"]})
callAPI('/deviceons/api/device/processrecord/find',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})

callAPI('/deviceons/api/device/detail',{'agentId':'00000001-0000-0000-0000-000BABC55FDF'})
