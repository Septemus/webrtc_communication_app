var ip, ip0, true_ip, found
const status_bar = document.getElementsByClassName('buttom_status_block')[0]
function round() {
    if (!found) {
        status_bar.innerHTML = ''
        console.log('searching')
        // for (let i = 0; i <= 255; ++i) {

        //     ip = ip0 + i
        //     status_bar.innerHTML += '<p>sending' + ip + '</p>'

        //     $.ajax({
        //         type: 'post',
        //         url: 'http://' + ip + ':3007/api/ipfetch',
        //         data: { ip }
        //     })
        //         .then(res => {
        //             console.log('ipfetch successful!', res.ip)
        //             true_ip = res.ip
        //             status_bar.innerHTML += '<p>true ip has been found</p>'
        //             found = true
        //         })
        //     .catch(err => {
        //         if (!found){console.log('0')}
        //             // status_bar.innerHTML += err.toString()
        //             // console.log(err)
        //     })
        // }
        var i = 0;
        setInterval(() => {
            if (!found) {
                if (i == 256) {
                    status_bar.innerHTML = ''
                    i = 0;
                }
                ip = ip0 + i
                status_bar.innerHTML += '<p>sending' + ip + '</p>'

                $.ajax({
                    type: 'post',
                    url: 'http://' + ip + ':3007/api/ipfetch',
                    data: { ip }
                })
                    .then(res => {
                        console.log('ipfetch successful!', res.ip)
                        true_ip = res.ip
                        status_bar.innerHTML += '<p>true ip has been found</p>'
                        found = true
                    })
                    .catch(err => {
                        if (!found) { console.log('0') }
                        // status_bar.innerHTML += err.toString()
                        // console.log(err)
                    })
                ++i;
            }

        }, 50)
    }

}
function onSuccess(ipInformation) {
    console.log("IP: " + ipInformation.ip + " subnet:" + ipInformation.subnet);
    ip = ipInformation.ip
    ip = ip.split('.')
    console.log(ip)
    ip = ip[0] + '.' + ip[1] + '.' + ip[2] + '.'
    ip0 = ip
    console.log(status_bar)
    found = false
    round()
    setInterval(round, 30000)
    // true_ip=ip+245
}



function onError(error) {
    // Note: onError() will be called when an IP address can't be
    // found, e.g. WiFi is disabled, no SIM card, Airplane mode
    console.log(error);
}



document.addEventListener("deviceready", onDeviceReady => {
    //cordova.exec 执行操作
    var networkinterface = function () {
    };

    networkinterface.getWiFiIPAddress = function (success, fail) {
        cordova.exec(success, fail, "networkinterface", "getWiFiIPAddress", []);
    };

    networkinterface.getCarrierIPAddress = function (success, fail) {
        cordova.exec(success, fail, "networkinterface", "getCarrierIPAddress", []);
    };

    networkinterface.getIPAddress = function (success, fail) {
        cordova.exec(success, networkinterface.getCarrierIPAddress.bind(null, success, fail), "networkinterface", "getWiFiIPAddress", []);
    };

    networkinterface.getHttpProxyInformation = function (url, success, fail) {
        cordova.exec(success, fail, "networkinterface", "getHttpProxyInformation", [url]);
    };

    console.log(cordova)
    console.log(networkinterface)

    networkinterface.getIPAddress(onSuccess, onError)
}, false);
