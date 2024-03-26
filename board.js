const pieceTypes = require('./pieces'); // Assuming pieces.js is in the same directory

const board = {
    size: { rows: 12, columns: 8 },
    squares: [],

    init: function() {
        this.createEmptyBoard();
        this.initializePieces();
    },

    createEmptyBoard: function() {
        for (let row = 0; row < this.size.rows; row++) {
            this.squares[row] = [];
            for (let col = 0; col < this.size.columns; col++) {
                this.squares[row][col] = { type: 'empty', data: {list:{}} };
            }
        }
        //console.log(this.squares)
    },

    initializePieces: function() {
        const startingPositions = {
            white: [
                { type: 'rook', row: 11, col: 0 },
                { type: 'knight', row: 11, col: 1 },
                { type: 'bishop', row: 11, col: 2 },
                { type: 'queen', row: 11, col: 3 },
                { type: 'king', row: 11, col: 4 },
                { type: 'bishop', row: 11, col: 5 },
                { type: 'knight', row: 11, col: 6 },
                { type: 'rook', row: 11, col: 7 },
                // Pawns - Rank 10
                { type: 'pawn', row: 10, col: 0 },
                { type: 'pawn', row: 10, col: 1 },
                { type: 'pawn', row: 10, col: 2 },
                { type: 'pawn', row: 10, col: 3 },
                { type: 'pawn', row: 10, col: 4 },
                { type: 'pawn', row: 10, col: 5 },
                { type: 'pawn', row: 10, col: 6 },
                { type: 'pawn', row: 10, col: 7 }, 
            ],
            black: [
                { type: 'rook', row: 0, col: 0 },
                { type: 'knight', row: 0, col: 1 },
                { type: 'bishop', row: 0, col: 2 },
                { type: 'queen', row: 0, col: 3 },
                { type: 'king', row: 0, col: 4 },
                { type: 'bishop', row: 0, col: 5 },
                { type: 'knight', row: 0, col: 6 },
                { type: 'rook', row: 0, col: 7 },
                // Pawns - Rank 1
                { type: 'pawn', row: 1, col: 0 },
                { type: 'pawn', row: 1, col: 1 },
                { type: 'pawn', row: 1, col: 2 },
                { type: 'pawn', row: 1, col: 3 },
                { type: 'pawn', row: 1, col: 4 },
                { type: 'pawn', row: 1, col: 5 },
                { type: 'pawn', row: 1, col: 6 },
                { type: 'pawn', row: 1, col: 7 }, 
            ]
        };

        for (const color of ['white', 'black']) {
            for (const pieceData of startingPositions[color]) {
                const { type, row, col } = pieceData;
                this.squares[row][col] = { ...pieceTypes[type], color };
            }
            for (let row = 2; row < 10; row++) {

                for (let col = 0; col < 8; col++) {
                    this.squares[row][col] = { type: 'empty', data: {list:{}} };
                    ;
                }
            }
        }
    }
};

module.exports = board;

function isValidMove(startSquare, endSquare, pieceType) {
    const piece = this.squares[startSquare.row][startSquare.col];

    // Check if a piece exists at the start square
    if (!piece) return false;

    // Verify if the piece type matches
    if (piece.type !== pieceType) return false;

    const allowedMoves = pieceTypes[pieceType].moves;

    for (const move of allowedMoves) {
        if (isValidDestination(startSquare, endSquare, move)) {
            return true; 
        }
    }

    return false; // No valid move found
}

function isValidDestination(startSquare, endSquare, move) {

    
    const rowDiff = endSquare.row - startSquare.row;
    const colDiff = endSquare.col - startSquare.col; 

    switch (move.direction) {
        case 'forward':
            return (rowDiff === move.maxSteps && colDiff === 0);
        case 'diagonal':
            const isCapture = move.captureOnly && this.isSquareOccupied(endSquare);

            return (Math.abs(startSquare.row - endSquare.row) ===  
                    Math.abs(startSquare.col - endSquare.col) && 
                    (isCapture || Math.abs(startSquare.row - endSquare.row) <= move.maxSteps) && 
                    this.isPathClear(startSquare, endSquare, 'diagonal'));
        case 'L-shape': // Knight logic
           // Remember: pieceTypes.knight.moves has offsets like: [{x: 2, y: 1}, {x: 1, y: 2}, ...]
            for (const offset of pieceTypes.knight.moves.offsets) {
                const destRow = startSquare.row + offset.y;
                const destCol = startSquare.col + offset.x;

                // Check if the destination is on the board and matches the endSquare
                if (destRow >= 0 && destRow < this.size.rows &&
                    destCol >= 0 && destCol < this.size.columns && 
                    destRow === endSquare.row && destCol === endSquare.col) {
                    return true; 
                }
            }
            return false;
        case 'horizontal': 
            return (startSquare.row === endSquare.row && // Same row
                    Math.abs(startSquare.col - endSquare.col) <= move.maxSteps &&
                    this.isPathClear(startSquare, endSquare, 'horizontal'));
        case 'vertical': 
            return (startSquare.col === endSquare.col && // Same column
                    Math.abs(startSquare.row - endSquare.row) <= move.maxSteps &&
                    this.isPathClear(startSquare, endSquare, 'vertical'));
        case 'king': // Add this for the king
            const rowDiff = Math.abs(startSquare.row - endSquare.row);
            const colDiff = Math.abs(startSquare.col - endSquare.col);
            return (rowDiff <= 1 && colDiff <= 1); // King can move one square in any direction
        default:
            return false;
  }
  
}

function isSquareOccupied(square) {
    return this.squares[square.row][square.col] !== 'empty';
}

function isPathClear(startSquare, endSquare, direction) {
    const rowDiff = endSquare.row - startSquare.row;
    const colDiff = endSquare.col - startSquare.col;
    let increment = 0;

    if (direction === 'horizontal') {
        increment = (colDiff > 0) ? 1 : -1; // Move right or left
    } else if (direction === 'vertical') {
        increment = (rowDiff > 0) ? 1 : -1; // Move up or down
    } else {
        return false; // Invalid direction
    }

    let currentRow = startSquare.row + increment;
    let currentCol = startSquare.col + increment;

    while (currentRow !== endSquare.row || currentCol !== endSquare.col) {
        if (this.isSquareOccupied({row: currentRow, col: currentCol})) {
            return false; // Path is blocked
        }
        currentRow += increment;
        currentCol += increment;
    }

    return true; // Path is clear
}



