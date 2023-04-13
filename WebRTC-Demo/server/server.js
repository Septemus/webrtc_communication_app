const HTTPS_PORT = 8443;
const PORT = 3000;
const fs = require('fs');

const serverConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

// ----------------------------------------------------------------------------------------
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
function checkTime(i) {
    if (i < 10) {
        i = "0" + i
    }; // add zero in front of numbers < 10
    return i;
}
require('dotenv').config();
const bodyParser = require("body-parser");
const express = require('express');
const app = express();
const moment = require('moment');
const https = require('https');
// const httpsServer = https.createServer(serverConfig, handleRequest);
const httpsServer = https.createServer(serverConfig, app);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
const { Server } = require('socket.io');
const io = new Server(httpsServer, {
    cors: {
        origin: '*',
        allowedHeaders: ['Content-Type']
    }
});
//io.listen(httpsServer).sockets;
const path = require('path')
const cors = require('cors')
app.use(express.static(path.join(__dirname, '../public')));
//  all variables for users
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}))

const { getIpAddress } = require('./getIpAddress')

const ip = getIpAddress()


let rooms = {};
let socketRooms = {};
let socketName = {};
let mic = {};
let video = {};
let whiteboard = {};

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
//const io = new WebSocketServer({ server: httpsServer });

io.on('connection', function (socket) {
    // const sockets = io.allSockets();
    // console.log(sockets);
    // const sockets = io.fetchSockets();
    // for (const socket of sockets)
    //   console.log(socket.id);

    socket.on('message', function (message) {
        console.log(message)
        var data = JSON.parse(message);
        io.to(data.roomid).emit('message', message);
        console.log(`${data.username} sent a txt message!`)
    });

    socket.on('error', (err) => {
        console.log(err);
    })

    socket.on('rooms', function (rooms) {
        var count = 0;
        var message = JSON.parse(rooms);
        socket.join(message.rooms);
        console.log(socket.id + '成功加入' + message.rooms);
        io.in(message.rooms).allSockets().then(items => {
            items.forEach(item => {
                count = count + 1;
            })
        });
        console.log(count);
    })

    socket.on("disconnect", async () => {
        const sockets = await io.fetchSockets();
        for (const socket of sockets)
            console.log(socket.id);
    });
    socket.on("sendMsg", function (data) {
        //data 为客户端发送的消息，可以是 字符串，json对象或buffer
        // 使用 emit 发送消息，broadcast 表示 除自己以外的所有已连接的socket客户端。
        console.log(data);
        socket.broadcast.to('rooms').emit('receiveMsg', data);
        io.sockets.emit("receiveMsg", data);
    })

    socket.on("join room", (roomid, username) => {
        socket.join(roomid);
        socketRooms[socket.id] = roomid;
        socketName[socket.id] = username;
        mic[socket.id] = 'on';
        video[socket.id] = 'on';
        if (rooms[roomid] && rooms[roomid].length > 0) {
            rooms[roomid].push(socket.id);
            socket.to(roomid).emit('message', JSON.stringify(
                {
                    msg: `${username} joined the room.`,
                    username: 'Meet-Bot',
                    roomid,
                    time: getTime()
                }
            ));
            io.to(socket.id).emit('join room', rooms[roomid].filter(pid => pid != socket.id), socketName, mic, video);
        } else {
            rooms[roomid] = [socket.id];
            io.to(socket.id).emit('join room', null, null, null, null);
        }
        io.to(roomid).emit('user count', rooms[roomid].length);

    });

    //  video/mic related stuff
    socket.on('action', msg => {
        if (msg == 'mute') {
            mic[socket.id] = 'off';
        }
        else if (msg == 'unmute') {
            mic[socket.id] = 'on';
        }
        else if (msg == 'videoon') {
            video[socket.id] = 'on';
        }
        else if (msg == 'videooff') {
            video[socket.id] = 'off';
        }
        socket.to(socketRooms[socket.id]).emit('action', msg, socket.id);
    });

    socket.on('video-offer', (offer, sid) => {
        socket.to(sid).emit('video-offer', offer, socket.id, socketName[socket.id], mic[socket.id], video[socket.id]);
    });

    socket.on('video-answer', (answer, sid) => {
        socket.to(sid).emit('video-answer', answer, socket.id);
    });

    socket.on('new icecandidate', (candidate, sid) => {
        socket.to(sid).emit('new icecandidate', candidate, socket.id);
    });

    //  Chats message


    //  Whiteboard canvas
    socket.on('getCanvas', () => {
        if (whiteboard[socketRooms[socket.id]])
            socket.emit('getCanvas', whiteboard[socketRooms[socket.id]]);
    });

    socket.on('draw', (newx, newy, prevx, prevy, color, size) => {
        socket.to(socketRooms[socket.id]).emit('draw', newx, newy, prevx, prevy, color, size);
    });

    socket.on('clearBoard', () => {
        socket.to(socketRooms[socket.id]).emit('clearBoard');
    });

    socket.on('store canvas', url => {
        whiteboard[socketRooms[socket.id]] = url;
    });
    socket.on('disconnectr', () => {
        if (!socketRooms[socket.id]) {
            return;
        }
        socket.to(socketRooms[socket.id]).emit('message', JSON.stringify(
            {
                msg: `${socketName[socket.id]} left the chat.`,
                username: `Meet-Bot`,
                roomid: rooms[socket.id],
                time: getTime()
            }
        )
        );
        socket.to(socketRooms[socket.id]).emit('remove peer', socket.id);
        let index = rooms[socketRooms[socket.id]].indexOf(socket.id);
        rooms[socketRooms[socket.id]].splice(index, 1);
        io.to(socketRooms[socket.id]).emit('user count', rooms[socketRooms[socket.id]].length);
        delete socketRooms[socket.id];
        console.log('leaving room.....');
        console.log(rooms[socketRooms[socket.id]]);
    });

});


httpsServer.listen(HTTPS_PORT, ip);
console.log(`Server running. Visit https://${ip}:` + HTTPS_PORT + ' in Firefox/Chrome'
);
