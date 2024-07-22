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
    const customRoomId = req.query.roomId;
    let sessionId;

    if (customRoomId && /^[a-zA-Z0-9]{4}$/.test(customRoomId)) {
        sessionId = customRoomId;
    } else {
        sessionId = shortid.generate().substring(0, 4);
    }

    if (sessions[sessionId]) {
        return res.status(400).json({ error: 'Room ID already in use. Please choose a different one.' });
    }

    board.init();

    sessions[sessionId] = {
        players: [],
        boardState: board.squares,
        chessPieceSprites: [],
        currentPlayer: 'white'  // Default first player
    };
    res.json({ sessionId });
});

// Endpoint to join an existing session
app.get('/join-session', (req, res) => {
    const sessionId = req.query.roomId;

    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Room ID not found.' });
    }

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

        const playerColor = session.players.length == 1 ? 'black' : 'white';
        console.log('Playing as: ', playerColor)
        session.players.push({ id: socket.id, color: playerColor });
        socket.join(sessionId);
        socket.emit('sessionState', { boardState: session.boardState, chessPieceSprites: session.chessPieceSprites, playerColor }); // Send initial game state
        socket.emit('updatePlayerColorDisplays')

        if (session.players.length == 2) {
            io.to(sessionId).emit('startGame');
            io.to(sessionId).emit('updatePlayerColorDisplays')
        }
    });


    socket.on('updateBoardState', (data) => {
        const sessionId = data.sessionId;
        const board = data.boardState;
        //const pieceSprites = data.serializedSprites;
        const action = data.action;
    
        console.log('Updating board state for session:', sessionId);
        console.log('Received Board State:', board);
        // console.log('Received Piece Sprites:', pieceSprites);
        console.log('Received Action:', action);
    
        const session = sessions[sessionId];
    
        if (!session) {
            socket.emit('error', 'Invalid session.');
            return;
        }
    
        session.boardState = board;
        //session.chessPieceSprites = pieceSprites;
    
        console.log('Broadcasting updateUI event');
        io.to(sessionId).emit('updateUI', { action });
    });

    socket.on('buy', (data) => {
        const sessionId = data.sessionId;
        const session = sessions[sessionId];
        const action = data



        io.to(sessionId).emit('updateUI', { action });
        
    })
    

    socket.on('disconnect', () => {
        for (const sessionId in sessions) {
            const session = sessions[sessionId];
            const playerIndex = session.players.findIndex(player => player.id === socket.id);

            if (playerIndex !== -1) {
                session.players.splice(playerIndex, 1);
                
                // If no players are left, remove the session
                if (session.players.length === 0) {
                    delete sessions[sessionId];
                    console.log(`Session ${sessionId} cleared.`);
                }
                break; // Exit loop after handling disconnection
            }
        }
        console.log(`Player ${socket.id} disconnected`);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
