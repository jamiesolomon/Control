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
    board.init()

    sessions[sessionId] = {
        players: [],
        gameState: board.squares,  // Initialize your game state here
        currentPlayer: 'white'  // Default first player
    };
    res.json({ sessionId });
});

app.get('/board-state/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    console.log(sessionId)
    const session = sessions[sessionId];
    //console.log(session)
    if (session) {
        res.json(session.gameState);
    } else {
        res.status(404).send('Session not found');
    }
});

io.on('connection', (socket) => {
    socket.on('joinSession', (sessionId) => {
        const session = sessions[sessionId];
        if (!session) {
            console.log('Session does not exist');
            socket.emit('error', 'Session does not exist.');
            return;
        }

        if (session.players.length >= 2) {
            console.log('Session is full');
            socket.emit('error', 'Session is full.');
            return;
        }

        // Ensure the first player is white and the second is black
        const playerColor = session.players.length == 0 ? 'white' : 'black';
        session.players.push({ id: socket.id, color: playerColor });
        socket.join(sessionId);
        //socket.emit('playerColor', playerColor); // Inform the player of their color
        socket.emit('sessionState', session.gameState); // Send initial game state

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
        
        console.log('Action received from player:', action.playerColor, 'in session:', sessionId);
        if (session.currentPlayer == action.playerColor) {
            processAction(session, action);
            session.currentPlayer = session.currentPlayer == 'white' ? 'black' : 'white';
            io.to(session).emit('sessionState', session.gameState);
        } else {
            socket.emit('error', 'Not your turn.');
        }
    });

    socket.on('disconnect', () => {
        // Here you could handle things like notifying other player, saving game state, etc.
        console.log(`Player ${socket.id} disconnected`);
    });

    socket.on('playerColor', (color) => {
        console.log(`You are playing as: ${color}`);
        if (color == 'white') {
            // Setup white player
        } else {
            // Setup black player
        }
    });


    socket.on('sessionState', (gameState) => {
        updateGame(gameState);
    });

    socket.on('startGame', () => {
        console.log('Both players joined. Game starts!');
        // Additional logic to start the game
    });



    
});


// Placeholder for game logic processing
function processAction(session, action) {
    // Update the session.gameState based on the action
    // This is very specific to your game mechanics
    console.log(`Processing action for session: ${session}`);
    //socket.emit('sessionState', session.gameState);
}

function updateGame(gameScene) {
    console.log('updating gamestate')
    console.log(gameScene.data.boardState)
    gameScene.data.boardState = gameState
}

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
