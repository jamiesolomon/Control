const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const shortid = require('shortid');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
const board = require('./board');

// Session storage
let sessions = {};

// Serve static files from 'public' directory
app.use(express.static('public'));

// Endpoint to create a new session
app.get('/new-session', (req, res) => {
    const sessionId = shortid.generate();
    board.init();

    sessions[sessionId] = {
        players: [],
        boardState: board.squares,  // Initialize your game state here
        currentPlayer: 'white'  // Default first player
    };
    res.json({ sessionId });
});

app.get('/board-state/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const session = sessions[sessionId];
    if (session) {
        res.json(session.boardState);
    } else {
        res.status(404).send('Session not found');
    }
});

io.on('connection', (socket) => {
    socket.on('joinSession', (sessionId) => {
        const session = sessions[sessionId];
        if (!session) {
            socket.emit('error', 'Session does not exist.');
            return;
        }

        if (session.players.length >= 2) {
            socket.emit('error', 'Session is full.');
            return;
        }

        const playerColor = session.players.length == 1 ? 'white' : 'black';
        session.players.push({ id: socket.id, color: playerColor });
        socket.join(sessionId);
        socket.emit('sessionState', session.boardState); // Send initial game state

        if (session.players.length == 2) {
            io.to(sessionId).emit('startGame');
        }
    });

    socket.on('gameAction', (data) => {
        const { sessionId, action } = data;
        const session = sessions[sessionId];

        if (!session) {
            socket.emit('error', 'Invalid session.');
            return;
        }

        if (session.currentPlayer == action.playerColor) {
            processAction(session, action);
            session.currentPlayer = session.currentPlayer == 'white' ? 'black' : 'white';
            io.to(sessionId).emit('sessionState', session.boardState);
        } else {
            socket.emit('error', 'Not your turn.');
        }
    });

    socket.on('updateBoardState', (data) => {
        console.log(data);

        const sessionId = data.sessionId;
        const board = data.boardState;

        console.log('Updating board state for session:', sessionId);
        console.log(board);
        const session = sessions[sessionId];

        if (!session) {
            socket.emit('error', 'Invalid session.');
            return;
        }

        session.boardState = board;
        io.to(sessionId).emit('updateUI', board);
    });

    socket.on('disconnect', () => {
        console.log(`Player ${socket.id} disconnected`);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
