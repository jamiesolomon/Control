const express = require('express');
const path = require('path'); 
const app = express();
const port = 3000; 
const board = require('./board'); 
board.init();

// Serve static files from the 'public' folder
app.use(express.static('public')); 

// Simple route for your initial HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

app.get('/board-state', (req, res) => {
    res.json(board); // Send the current board state
});