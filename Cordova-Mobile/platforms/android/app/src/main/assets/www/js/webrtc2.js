
var localDisplayName;
var localStream;
//用于WebRTC连接的类
var peerConnections = {};
var uuid;
var serverConnection;

var socket = io('https://' + window.localStorage.getItem('serverIP') + ':8443');


var peerConnectionConfig = {
    'iceServers': [
        {
            credential: "123456",
            username: "admin",
            urls: [
                "stun:18.162.113.79:3478",
            ]
        },
        /* 	{
                credential: "123456",
                username: "user",
                urls: [
                  "stun:47.99.146.151:3478",
                ]
            },
            { 'urls': 'stun:stun.stunprotocol.org:3478' }, */
        { 'urls': 'stun:stun.l.google.com:19302' },

        {
            credential: "123456",
            username: "user",
            urls: [
                "turn:47.99.146.151:3478",
            ]
        },
    ]
    /*  'iceTransportPolicy': "relay" */
};

function start1() {
    var constraints =
    {
        "audio": true,
        "video": {
            "width": {
                "min": "480",
                "max": "1920"
            },
            "height": {
                "min": "360",
                "max": "1080"
            },
            "frameRate": {
                "min": "15",
                "max": "20"
            }
        }
    };

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                localStream = stream;
                document.getElementById('localVideo').srcObject = stream;
                //     }).catch(errorHandler)
            }).catch(function (err) {

                if (err.name == "NotFoundError" || err.name == "DeviceNotFoundError") {
                    // require track is missing
                    console.log('require track is missing');
                } else if (err.name == "NotReadableError" || err.name == "TrackStartError") {
                    // webcam or mic are already in use
                    console.log('webcam or mic are already in use');
                } else if (err.name == "OverconstrainedError" || err.name == "ConstraintNotSatisfiedError") {
                    // constraints can not be satisfied by avb.device
                    console.log('constraints can not be satisfied by avb.device');
                } else if (err.name == "NotAllowedError" || err.name == "PermissionDeniedError") {
                    // permission denied in browser
                    console.log('permission denied in browser');
                } else if (err.name == "TypeError" || err.name == "TypeError") {
                    // empty constraints object
                    console.log('empty constraints object');
                } else {
                    // other errors
                    errorHandler(err);
                }
            })
            .then(() => {
                serverConnection = new WebSocket('wss://' + window.localStorage.getItem('serverIP') + ':' + 8443);
                console.log('window.location.hostname: ' +window.localStorage.getItem('serverIP'));
                serverConnection.onmessage = gotMessageFromServer;
                serverConnection.onopen = event => {
                  serverConnection.send(JSON.stringify({ 'displayName': localDisplayName, 'uuid': uuid, 'dest': 'all' }));
                }
              }).catch(errorHandler);
    }
    else {
        alert('Your browser does not support getUserMedia API');
    }
}

var app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: async function () {
        uuid = createUUID();

        // localVideo = document.getElementById('localVideo');
        //  remoteVideo = document.getElementById('remoteVideo');


        localDisplayName =window.localStorage.getItem('tagname')|| prompt('Enter your name', '');
        document.getElementById('localVideoContainer').appendChild(makeLabel(localDisplayName));

        // this.receivedEvent('deviceready');
        var permissions = cordova.plugins.permissions;
        var tmp_list = [
            permissions.CAMERA,
            // permissions.MICROPHONE,
            permissions.RECORD_AUDIO,
            permissions.MODIFY_AUDIO_SETTINGS
        ]
        var start = document.getElementById('start')
        // var permissions_acquired=true
        var permissions_acquired = 0;
        for (let i in tmp_list) {
            await permissions.hasPermission(tmp_list[i], function (status) {
                if (status.hasPermission) {
                    // here you can savely start your own plugin because you already have CAMERA permission
                    // start();
                    // console.log('permissions acquired!')
                    console.log('already have permission')
                    permissions_acquired += 1
                    if (permissions_acquired === 2) {
                        start.addEventListener('click', start1)
                    }
                }
                else {
                    // need to request camera permission
                    console.log('requesting permission')
                    permissions.requestPermission(tmp_list[i], success, error);
                    function error() {
                        // camera permission not turned on        
                        // appendElement('p', 'Please accept the Android permissions.', codes.error);
                        console.log('camera permission not turned on')
                        permissions_acquired = 0
                    }

                    function success(status) {
                        if (status.hasPermission) {
                            // user accepted, here you can start your own plugin
                            // console.log('permissions acquired!')
                            console.log('request success')
                            permissions_acquired += 1
                            if (permissions_acquired === 2) {
                                start.addEventListener('click', start1)
                            }
                        }
                    }
                }
            });
        }
        // console.log(permissions_acquired)
        // if (permissions_acquired === 3) console.log('permissions acquired!')
    },
};

function gotMessageFromServer(message) {
    var signal = JSON.parse(message.data);
    var peerUuid = signal.uuid;
  
    // Ignore messages that are not for us or from ourselves
    if (peerUuid == uuid || (signal.dest != uuid && signal.dest != 'all')) return;
  
    if (signal.displayName && signal.dest == 'all') {
      // set up peer connection object for a newcomer peer
      setUpPeer(peerUuid, signal.displayName);
      serverConnection.send(JSON.stringify({ 'displayName': localDisplayName, 'uuid': uuid, 'dest': peerUuid }));
  
    } else if (signal.displayName && signal.dest == uuid) {
      // initiate call if we are the newcomer peer
      setUpPeer(peerUuid, signal.displayName, true);
  
    } else if (signal.sdp) {
      peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
        // Only create answers in response to offers
        if (signal.sdp.type == 'offer') {
          peerConnections[peerUuid].pc.createAnswer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
        }
      }).catch(errorHandler);
  
    } else if (signal.ice) {
        peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
   
  }
  
  function setUpPeer(peerUuid, displayName, initCall = false) {
    peerConnections[peerUuid] = { 'displayName': displayName, 'pc': new RTCPeerConnection(peerConnectionConfig) };
    peerConnections[peerUuid].pc.onicecandidate = event => gotIceCandidate(event, peerUuid);
    peerConnections[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid);
    peerConnections[peerUuid].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peerUuid);
    peerConnections[peerUuid].pc.addStream(localStream);
  
    if (initCall) {
      peerConnections[peerUuid].pc.createOffer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
    }
    
    console.log(`peerConnections start`);
    console.log(peerConnections)
    console.log(`peerConnections end`);
  }
  
  
  function gotIceCandidate(event,peerUuid) { //新增了参数
    if (event.candidate != null) {
      serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': uuid, 'dest':peerUuid }));
    }
  }
  
  function createdDescription(description,peerUuid) {
    console.log(`got description, peer ${peerUuid}`);
  
    peerConnections[peerUuid].pc.setLocalDescription(description).then(function () {
      serverConnection.send(JSON.stringify({ 'sdp': peerConnections[peerUuid].pc.localDescription, 'uuid': uuid, 'dest':peerUuid }));
    }).catch(errorHandler);
  }
  
  function gotRemoteStream(event, peerUuid) {
    console.log(`got remote stream, peer ${peerUuid}`);
  
    if (document.getElementById('remoteVideo_' + peerUuid) != null)
    {
        console.log(`getElementById('remoteVideo_' + peerUuid) has existed: ${peerUuid}`);
        return;
    }  //多加判断语句***********************************************************************************************************************************************有疑问
    //remoteVideo.srcObject = event.streams[0];
    var vidElement = document.createElement('video');
    vidElement.setAttribute('autoplay', '');
    vidElement.setAttribute('muted', '');
    vidElement.srcObject = event.streams[0];
  
    var vidContainer = document.createElement('div');
    vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
    vidContainer.setAttribute('class', 'videoContainer');
    vidContainer.appendChild(vidElement);
    vidContainer.appendChild(makeLabel(peerConnections[peerUuid].displayName));
  
    document.getElementById('videos').appendChild(vidContainer);
  
    updateLayout();//更改css样式，还没具体看********************************************************************************************************************
  }
  function checkPeerDisconnect(event, peerUuid) { //检查peer连接状态**************************************************************
	
    var state = peerConnections[peerUuid].pc.iceConnectionState;
    console.log(`connection with peer ${peerUuid} ${state}`);
    
    if (state === "failed" || state === "closed" ) { // || state === "disconnected") {
      delete peerConnections[peerUuid];
      document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
      updateLayout();
    }
  }
  
  function updateLayout() {
    // update CSS grid based on number of diplayed videos
    var rowHeight = '98%';
    var colWidth = '98%';
  
    var numVideos = Object.keys(peerConnections).length + 1; // add one to include local video
  
    if (numVideos > 1 && numVideos <= 4) { // 2x2 grid
      rowHeight = '48%';
      colWidth = '48%';
    } else if (numVideos > 4) { // 3x3 grid
      rowHeight = '32%';
      colWidth = '32%';
    }
  
    document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
    document.documentElement.style.setProperty(`--colWidth`, colWidth);
  }
function errorHandler(error) {
    console.log(error);
  }

function makeLabel(label) {                             //有区别的函数
    var vidLabel = document.createElement('div');        //有区别的函数
    vidLabel.appendChild(document.createTextNode(label));//有区别的函数
    vidLabel.setAttribute('class', 'videoLabel');        //有区别的函数
    return vidLabel;
  }    

function createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
  
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }


app.initialize();