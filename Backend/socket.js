const socketIo = require('socket.io');
const teamModel = require('./models/team.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected');

        socket.on('join:auction', (auctionId) => {
            socket.join(`auction:${auctionId}`);
        });

        socket.on('place:bid', async (data) => {
            // Handle bid placement
            io.to(`auction:${data.auctionId}`).emit('bid:update', data);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };