const socket = io('https://'+window.localStorage.serverIP + ':8443');
const overlayContainer = document.querySelector('#overlay')
const continueButt = document.querySelector('.continue-name');
const nameField = document.querySelector('#name-field');
const chatRoom = document.querySelector('.chat-cont');
const sendButton = document.querySelector('.chat-send');
const messageField = document.querySelector('.chat-input');
const cutCall = document.querySelector('.cutcall');
let chatToggle = document.querySelector(".chatting");

//  Room id
const roomid = params.get("room");
document.querySelector('.roomcode').innerHTML = `${roomid}`

//  name set
let vidCon;

let username = params.get('name')

if (username) {
    overlayContainer.classList.add("hidden");
    //overlayContainer.style.visibility = 'hidden';
    document.querySelector("#myname").innerHTML = `${username} (You)`;
    socket.emit("join room", roomid, username);
}
else {
    continueButt.addEventListener('click', () => {
        if (nameField.value == '') return;
        username = nameField.value;
        overlayContainer.classList.add("hidden");
        //overlayContainer.style.visibility = 'hidden';
        document.querySelector("#myname").innerHTML = `${username} (You)`;
        socket.emit("join room", roomid, username);
    })
}


nameField.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        continueButt.click();
    }
});

//  Chat
sendButton.addEventListener('click', () => {
    const msg = messageField.value;
    messageField.value = '';
    // socket.emit('message', msg, username, roomid);
    var time = getTime()
    var tmp = JSON.stringify({
        msg,
        username,
        roomid,
        time
    })
    console.log(tmp)
    socket.emit('message', tmp);
})

messageField.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        sendButton.click();
    }
});

socket.on('message', (message) => {
    message = JSON.parse(message)
    chatRoom.scrollTop = chatRoom.scrollHeight;
    let time = message.time
    time = `${time.h}:${time.m}:${time.s}`
    chatRoom.innerHTML += `<div class="message">
    <div class="info">
        <div class="username">${message.username}</div>
        <div class="time">${time}</div>
    </div>
    <div class="content">
        ${message.msg}
    </div>
</div>`
});

//  End Meet
cutCall.addEventListener('click', () => {
    location.href = `/chatroom_mp.html?name=${username}`;
})
let xchat=document.getElementById('turnoff_chat')
xchat.addEventListener('click',()=>{
    chatContainer.classList.toggle("hidden");
})
//  Meet Clock

function getTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    return {
        h, m, s
    }
}

function startTime() {
    var cur = getTime()
    document.querySelector('.meet-time').innerHTML = cur.h + ":" + cur.m + ":" + cur.s;
    setTimeout(startTime, 1000);
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }; // add zero in front of numbers < 10
    return i;
}

startTime();

//  Chat slide
let chatContainer = document.querySelector(".right-cont");
chatToggle.addEventListener('click', () => {
    chatContainer.classList.toggle("hidden");
});

///  Full Screen
function openFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        /* IE11 */
        elem.msRequestFullscreen();
    }
}


function allFullScreen() {
    //console.log("count is " + count);
    let fullBut = document.querySelectorAll(`.full-screen`);
    for (let i = 0; i < fullBut.length; i++) {
        //console.log("here + " + i + i);
        fullBut[i].addEventListener('click', () => {
            let fullVideo = fullBut[i].parentNode;
            openFullscreen(fullVideo);
        })
    }
    setTimeout(allFullScreen, 1);
}

allFullScreen();