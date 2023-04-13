const os = require('os');
function getIpAddress() {
    var interfaces = os.networkInterfaces() //获取网络接口
    for (var dev in interfaces) {
      let iface = interfaces[dev]
      // console.log('this is dev',dev)
      for (let i = 0; i < iface.length; i++) {
        // console.log('this is iface[i]',iface[i])
        let { family, address, internal } = iface[i]
        if ( (dev.search('WLAN')!=-1 || dev.search('Wi-Fi') != -1) && family === 'IPv4' && address !== '127.0.0.1' && !internal) {
          // if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
          return address
        }
      }
    }
}
module.exports={getIpAddress}