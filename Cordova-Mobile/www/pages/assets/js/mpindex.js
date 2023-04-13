const createButton = document.querySelector("#createroom");
const videoCont = document.querySelector('.video-self');
const codeCont = document.querySelector('#roomcode');
const joinBut = document.querySelector('#joinroom');
const mic = document.querySelector('#mic');
const cam = document.querySelector('#webcam');

let micAllowed = 1;
let camAllowed = 1;

let mediaConstraints = {
    video: true,
    audio: true
};

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

        // localVideo = document.getElementById('localVideo');
        //  remoteVideo = document.getElementById('remoteVideo');

        // this.receivedEvent('deviceready');
        var permissions = cordova.plugins.permissions;
        var tmp_list = [
            permissions.CAMERA,
            // permissions.MICROPHONE,
            permissions.RECORD_AUDIO,
            permissions.MODIFY_AUDIO_SETTINGS
        ]
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
                        start1()
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
                                start1()
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

function start1() {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(localstream => {
        videoCont.srcObject = localstream;
    })
    cam.addEventListener('click', () => {
        if (camAllowed) {
            mediaConstraints = {
                video: false,
                audio: micAllowed ? true : false
            };
            navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then(localstream => {
                    videoCont.srcObject = localstream;
                })

            cam.classList = "nodevice";
            cam.innerHTML = `<i class="fas fa-video-slash"></i>`;
            camAllowed = 0;
        } else {
            mediaConstraints = {
                video: true,
                audio: micAllowed ? true : false
            };
            navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then(localstream => {
                    videoCont.srcObject = localstream;
                })

            cam.classList = "device";
            cam.innerHTML = `<i class="fas fa-video"></i>`;
            camAllowed = 1;
        }
    })

    mic.addEventListener('click', () => {
        if (micAllowed) {
            mediaConstraints = {
                video: camAllowed ? true : false,
                audio: false
            };
            navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then(localstream => {
                    videoCont.srcObject = localstream;
                })

            mic.classList = "nodevice";
            mic.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
            micAllowed = 0;
        } else {
            mediaConstraints = {
                video: camAllowed ? true : false,
                audio: true
            };
            navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then(localstream => {
                    videoCont.srcObject = localstream;
                })

            mic.innerHTML = `<i class="fas fa-microphone"></i>`;
            mic.classList = "device";
            micAllowed = 1;
        }
    })
}


//  Generating room code
function uuidv4() {
    return 'xxyxyxxyx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

//  Creating Room
const createroomtext = 'Creating Room...';

createButton.addEventListener('click', (e) => {
    e.preventDefault();
    createButton.disabled = true;
    createButton.innerHTML = 'Creating Room';
    createButton.classList = 'createroom-clicked';

    setInterval(() => {
        if (createButton.innerHTML < createroomtext) {
            createButton.innerHTML = createroomtext.substring(0, createButton.innerHTML.length + 1);
        } else {
            createButton.innerHTML = createroomtext.substring(0, createButton.innerHTML.length - 3);
        }
    }, 500);

    location.href = `./room.html?room=${uuidv4()}&name=${myname}`;
});

//  Joining Room
joinBut.addEventListener('click', (e) => {
    e.preventDefault();
    if (codeCont.value.trim() == "") {
        codeCont.classList.add('roomcode-error');
        return;
    }
    const code = codeCont.value;
    location.href = `./room.html?room=${code}&name=${myname}`;
})

codeCont.addEventListener('change', (e) => {
    e.preventDefault();
    if (codeCont.value.trim() !== "") {
        codeCont.classList.remove('roomcode-error');
        return;
    }
})

//  Index page cam/audio

//  Index Clock
function startTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.querySelector('.index-time').innerHTML = h + ":" + m + ":" + s;
    setTimeout(startTime, 1000);
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }; // add zero in front of numbers < 10
    return i;
}

startTime();
app.initialize()