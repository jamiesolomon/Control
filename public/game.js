// const board = require("../board");

// const e = require("express");

const scale = 0.4
const squareSize = 192 * scale
let chessPieceSprites = [];
const boardColors = createBaseColorBoard()
let originalPiecePositions = []
let boardState = null
let turnDisplay = null
let pieceButton = null
const greenVal = 0.5
const yellowVal = 1
let gameScene = null;
let pieceIds = []
let pieceCount = 1
const socket = io(); // This should be accessible across your script



// INSTANTIATE PLAYERS IN SERVER NOT GAME.JS FILE!!!

class Player {
    constructor() {
      this.victoryPoints = 0;
      this.coins = 0;
      this.color = '';
      this.coinIncome = 0;
      this.pointIncome = 0;
    }
  }
  
const player1 = new Player();
player1.color = 'white';
const player2 = new Player();
player2.color = 'black';
const  allPlayers = [player1, player2]
let currentPlayer = player1

let currentPlayerColor = currentPlayer.color; // Start with Player 1


function updateTurnDisplay() {
  turnDisplay.textContent = `Player ${currentPlayerColor}'s Turn`;
  //console.log(currentPlayerColor)
}

// Call updateTurnDisplay initially
//updateTurnDisplay();



const config = {
    type: Phaser.AUTO, 
    width: 1536 * scale, // Adjust if needed
    height: 2304 * scale, // Adjust if needed
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
    }
};

const game = new Phaser.Game(config);
//console.log(game)
game.data = new Phaser.Data.DataManager(game);
game.data.boardState = null
//console.log(game)

function preload() {
    this.load.image('board', 'assets/ControlBoard_8x12.png'); 

    const pieceTypes = ['pawn', 'bishop', 'knight', 'rook', 'queen', 'king'];
    const colors = ['white', 'black'];

    for (const color of colors) {
        for (const type of pieceTypes) {
            const imageKey = type.charAt(0).toUpperCase() + type.slice(1) + '_' + color.charAt(0).toUpperCase() + color.slice(1); 
            this.load.image(imageKey, 'assets/' + imageKey + '.png'); 
            //console.log(imageKey)
        }
    }
    this.load.image('placeholder', 'assets/tempSquare.png');

    //console.log('Images loaded');

    return new Promise(resolve => {
        this.load.on('complete', resolve); // Resolve after all images load
    });
}

function create() {
    //console.log(this)
    gameScene = this; // 'this' is the Phaser scene here
    //window.game = game;
    
    // Calculate the vertical center
    const verticalCenter = game.config.height / 2;
    const horizontalCenter = game.config.width / 2;

    //add board
    this.add.image(horizontalCenter, verticalCenter, 'board').setScale(scale); // Adjust if needed

    const sessionId = new URLSearchParams(window.location.search).get('session');
    console.log(sessionId)
    
    if (sessionId) {
        // Fetch initial board state 
        fetch(`/board-state/${sessionId}`)
                .then(response => response.json())
                .then(data => {
                    //SHOULD BE LOGGING 'EMPTY' SQUARES, NOT NULL
                    console.log(data)
                    boardState = data.squares;
                    gameScene.data.boardState = data
                    gameScene.data.startBoardState = data
                    //console.log(data.squares)
                    initializePieces.call(this, boardState); 
                    populateBuybackUI.call(this, boardState)
                    turnDisplay = document.getElementById('turn-display');
                    //setOriginalState(boardState)
                    //console.log(turnDisplay)         
                });
            }

        // Enable drag for all sprites
        //this.input.setDraggable(chessPieceSprites);
        //console.log(chessPieceSprites)


    

    // Event listeners
    //const pieceButton = this.add.button(/* ... button properties ... */);

    // pieceButton.on('click', function(gameObject) {
    //     console.log(gameObject);
    // });

    this.input.on('dragstart', function (pointer, gameObject) {
        //console.log("Dragstart event fired!")
        gameObject.startPosition = { x: gameObject.x, y: gameObject.y };
    });

        
    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });

        
        

    this.input.on('dragend', function (pointer, gameObject) {
        //console.log(gameObject)
        // Snap configuration (adjust as needed)
        const snapSize = squareSize/2; // Assuming squares as your snapping targets

        // Snapping Logic
        // if (gameObject.x)
        // {

        // } else {
        //     const newX = Math.round(gameObject.x / snapSize) * snapSize;
        //     const newY = Math.round(gameObject.y / snapSize) * snapSize;
        // }
        //log("X value: " + gameObject.x)
        //console.log("Y Value: " + gameObject.y)

        const newX = Math.floor(gameObject.x / squareSize) * squareSize + snapSize;
        const newY = Math.floor(gameObject.y / squareSize) * squareSize + snapSize;



        // const newX = newRow * squareSize;
        // const newY = newCol * squareSize;

        // Capture logic
        const targetRow = Math.floor(gameObject.y / squareSize); 
        const targetCol = Math.floor(gameObject.x / squareSize);

        if (isValidMove(gameObject, targetRow, targetCol, boardState, currentPlayer)) {
            //console.log(currentPlayer)
            //console.log('test')
            //console.log(gameObject)
            //console.log(boardState)

            
            

            // Capture if necessary 
            const capturedPiece = gameScene.data.boardState[targetRow][targetCol]; 
            //console.log(capturedPiece)


            if (capturedPiece.type != 'empty' && capturedPiece.data.list.color == currentPlayer.color) {
                gameObject.x = gameObject.startPosition.x;
                gameObject.y = gameObject.startPosition.y;
                return

            }

            // console.log(capturedPiece)
            // console.log(currentPlayer)
            if (capturedPiece.type != 'empty' && capturedPiece.data.list.color != currentPlayer.color) {
                console.log('Capturing piece: ')
                console.log(capturedPiece)
                const index = chessPieceSprites.findIndex(sprite => 
                    // sprite.data.get('row') === targetRow && 
                    // sprite.data.get('col') === targetCol); 
                    sprite.data.get('id') === capturedPiece.data.list.id); 
                chessPieceSprites[index].visible = false; // Hide the sprite
                //chessPieceSprites.splice(index, 1); // Remove the sprite from the array
            }
            
            const tempRow = gameObject.data.list.row
            const tempCol = gameObject.data.list.col
            //update object position
            gameObject.x = newX;
            gameObject.y = newY;
            gameObject.data.list.row = targetRow;
            gameObject.data.list.col = targetCol;
    
            // Update boardState: 
            //console.log(gameObject)
            gameScene.data.boardState[targetRow][targetCol] = gameObject;
            gameScene.data.boardState[tempRow][tempCol] = { type: 'empty' };
            //console.log(gameObject)
            //console.log(boardState)
            gameScene.data.boardState[targetRow][targetCol].color = gameObject.data.list.color
            gameScene.data.boardState[targetRow][targetCol].piece = gameObject

    
            // Re-render the board if necessary
            //updatePlayerStatsUI()
            handleEndTurn(boardState)
            const action = {
                playerColor: currentPlayer.color,
                type: 'move',
                details: {
                    from: {row: tempRow, col: tempCol},
                    to: {row: targetRow, col: targetCol}
                }    
            }
            sendGameAction(action)

            const sessionId = new URLSearchParams(window.location.search).get('session');

            
            switchTurns()
            handleStartTurn(boardState)
            
            // console.log(player1)
            // console.log(player2)
            // (Potentially) updateBlocking(boardState); 
            } else {
                // Handle invalid move (snap back into place, etc.)  
                gameObject.x = gameObject.startPosition.x;
                gameObject.y = gameObject.startPosition.y;
            }
        });


        

        // Add a temperary red square:
        //this.add.image(200, 300, 'placeholder'); 

       
}

function initializePieces() {
    //console.log(this)
    //console.log(game.data.boardState)
    console.log(gameScene)
    // 1. Iterate through boardState to access piece data

    
    
    for (let row = 0; row < gameScene.data.boardState.length; row++) {
        for (let col = 0; col < gameScene.data.boardState[row].length; col++) {
            const piece = gameScene.data.boardState[row][col];
            //console.log(piece)
            if (piece.type != 'empty') {
                // 2. Create a sprite based on piece.type and piece.color
                //console.log(piece)
                let spriteName = piece.type.charAt(0).toUpperCase() + piece.type.slice(1) + '_' + piece.color.charAt(0).toUpperCase() + piece.color.slice(1);
                const x = col * squareSize + squareSize/2;
                const y = row * squareSize + squareSize/2;
                //console.log(spriteName)
                //console.log(this)
                const sprite = this.add.sprite(x, y, spriteName);
                sprite.type = piece.type
                sprite.data = new Phaser.Data.DataManager(sprite);
                //console.log(sprite);
                //console.log(sprite.texture);
                sprite.setInteractive();
                //console.log(sprite)
                sprite.data.set('row', row); // Store row and column 
                sprite.data.set('col', col);
                sprite.data.set('startRow', row)
                sprite.data.set('startCol', col)
                sprite.data.set('color', piece.color)
                
                if (pieceIds.includes(spriteName)) {
                    spriteName = (spriteName + pieceCount)
                    pieceCount++
                }
                sprite.data.set('id', spriteName)

                // boardState[row][col].color = piece.color
                // boardState[row][col].row = row
                // boardState[row][col].col = col
                // boardState[row][col].id = spriteName
                gameScene.data.boardState[row][col] = sprite
                // 3. Store sprite (or an object containing the sprite) in chessPieceSprites
                chessPieceSprites.push(sprite); 
                pieceIds.push(spriteName)
                //console.log(spriteName + ' created')
                //console.log(pieceIds)
            } else {
                //boardstate[row][col] = { type: 'empty' };

            }
        }
    }
    //console.log(chessPieceSprites)

    // 4. Enable dragging for the sprites
    chessPieceSprites.forEach(sprite => this.input.setDraggable(sprite));
    setOriginalState(gameScene.data.boardState)
    //game.data.boardState = boardState
    //console.log(boardState)
    //gameScene.data.boardState = boardState

}

// ... drag start/drag/dragend event handlers (might need adjustments) ...

// ----- Helper Functions -----
function isValidMove(piece, newRow, newCol, boardState, currentPlayer) { 
    // ... your existing logic for boundary checks... 
    //console.log(piece)

    const validMoves = calculateValidMoves(piece, boardState); 
    //console.log("Valid Move:", piece, newRow, newCol);
    //console.log("Captured Piece:", boardState[newRow][newCol]);
    const isTrue = validMoves.some(move => move.row === newRow && move.col === newCol && currentPlayer.color == piece.data.list.color)
    //console.log('Movie is: ' + isTrue)
    return validMoves.some(move => move.row === newRow && move.col === newCol && currentPlayer.color == piece.data.list.color);
}


function calculateValidMoves(piece, boardState) {
    //console.log(piece)
    //const row = Math.floor(piece.y / squareSize); 
    //const col = Math.floor(piece.x / squareSize);
    const type = piece.type
    const validMoves = [];
    let row = piece.data.list.row; 
    let col = piece.data.list.col;
    let color = piece.data.list.color
    let direction = (color === 'white') ? -1 : 1; // Forward based on color
    let currentCol = col;
    

    switch (type) {
        case 'rook':
            // Check horizontal directions
            for (let i = col + 1; i < 8; i++) {
                if (gameScene.data.boardState[row][i].type == 'empty') {
                    validMoves.push({ row, col: i });
                } else {
                    if (gameScene.data.boardState[row][i].color !== color) {
                        validMoves.push({ row, col: i });
                    }
                    break; 
                }
            }
            for (let i = col - 1; i >= 0; i--) {
                if (gameScene.data.boardState[row][i].type == 'empty') {
                    validMoves.push({ row, col: i });
                } else {
                    if (gameScene.data.boardState[row][i].color !== color) {
                        //console.log(boardState[row][i].color)
                        //console.log(color)
                        validMoves.push({ row, col: i });
                    }
                    break; 
                }
            }
            // Check vertical directions
            for (let i = row + 1; i < 12; i++) {
                if (gameScene.data.boardState[i][col].type == 'empty') { 
                    validMoves.push({ row: i, col });
                } else { 
                    if (gameScene.data.boardState[i][col].color !== color) { 
                        validMoves.push({ row: i, col });
                    }
                    break;
                }
            }
            for (let i = row - 1; i >= 0; i--) {
                if (gameScene.data.boardState[i][col].type == 'empty') { 
                    validMoves.push({ row: i, col });
                } else { 
                    if (gameScene.data.boardState[i][col].color !== color) { 
                        validMoves.push({ row: i, col });
                    }
                    break;
                }
            }

            // Similar logic for scanning left, up, and down ...
            break;
        case 'bishop':
            
            // Check each diagonal direction
            for (let offset = 1; offset < 8; offset++) {
                let rowToCheck = row + offset;
                let colToCheck = col + offset;
                // Check top-right diagonal
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck += offset;
                    colToCheck += offset;
                }

                // Check bottom-right diagonal
                rowToCheck = row + offset;
                colToCheck = col - offset;
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck += offset;
                    colToCheck -= offset;
                }

                // Check bottom-left diagonal
                rowToCheck = row - offset;
                colToCheck = col - offset;
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck -= offset;
                    colToCheck -= offset;
                }

                // Check top-left diagonal
                rowToCheck = row - offset;
                colToCheck = col + offset;
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck -= offset;
                    colToCheck += offset;
                }
            }
            break;
        case 'knight':
            // Knight's L-shaped movement (+/- 2 rows, +/- 1 col) or (+/- 1 row, +/- 2 cols)
            const knightOffsets = [
                [-2, 1], [-2, -1], [1, 2], [1, -2],
                [2, 1], [2, -1], [-1, 2], [-1, -2]
            ];
            for (const [rowOffset, colOffset] of knightOffsets) {
                const newRow = row + rowOffset;
                const newCol = col + colOffset;

                if (inBounds(newRow, newCol) && 
                    (gameScene.data.boardState[newRow][newCol].type == 'empty' || gameScene.data.boardState[newRow][newCol].color != piece.data.list.color)) { // Empty square or enemy piece
                        validMoves.push({ row: newRow, col: newCol });
                        // console.log(boardState[newRow][newCol].color)
                        // console.log(piece.data.list.color)
                    }
            }
            break;
        case 'queen':
             // Horizontal and Vertical Movement (like a rook)
             for (let i = col + 1; i < 8; i++) {
                if (gameScene.data.boardState[row][i].type == 'empty') {
                    //console.log(boardState)
                    validMoves.push({ row, col: i });
                } else {
                    if (gameScene.data.boardState[row][i].color !== color) {
                        validMoves.push({ row, col: i });
                    }
                    break; 
                }
            }
            for (let i = col - 1; i >= 0; i--) {
                if (gameScene.data.boardState[row][i].type == 'empty') {
                    validMoves.push({ row, col: i });
                } else {
                    if (gameScene.data.boardState[row][i].color !== color) {
                        //console.log(boardState[row][i].color)
                        //console.log(color)
                        validMoves.push({ row, col: i });
                    }
                    break; 
                }
            }
            // Check vertical directions
            for (let i = row + 1; i < 12; i++) {
                if (gameScene.data.boardState[i][col].type == 'empty') { 
                    validMoves.push({ row: i, col });
                } else { 
                    if (gameScene.data.boardState[i][col].color !== color) { 
                        validMoves.push({ row: i, col });
                    }
                    break;
                }
            }
            for (let i = row - 1; i >= 0; i--) {
                if (gameScene.data.boardState[i][col].type == 'empty') { 
                    validMoves.push({ row: i, col });
                } else { 
                    if (gameScene.data.boardState[i][col].color !== color) { 
                        validMoves.push({ row: i, col });
                    }
                    break;
                }
            }
            

            // Diagonal Movement (like a bishop)
            // Check each diagonal direction
            for (let offset = 1; offset < 8; offset++) {
                let rowToCheck = row + offset;
                let colToCheck = col + offset;
                // Check top-right diagonal
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck += offset;
                    colToCheck += offset;
                }

                // Check bottom-right diagonal
                rowToCheck = row + offset;
                colToCheck = col - offset;
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck += offset;
                    colToCheck -= offset;
                }

                // Check bottom-left diagonal
                rowToCheck = row - offset;
                colToCheck = col - offset;
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck].type != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck -= offset;
                    colToCheck -= offset;
                }

                // Check top-left diagonal
                rowToCheck = row - offset;
                colToCheck = col + offset;
                while (inBounds(rowToCheck, colToCheck)) {
                    if (gameScene.data.boardState[rowToCheck][colToCheck] != 'empty') { // Piece encountered
                        if (gameScene.data.boardState[rowToCheck][colToCheck].color !== color) { 
                            validMoves.push({ row: rowToCheck, col: colToCheck }); // Capture
                        }
                        break; // Stop on encountering a piece (friend or foe) 
                    } else { 
                        validMoves.push({ row: rowToCheck, col: colToCheck }); // Empty square
                    }
                    rowToCheck -= offset;
                    colToCheck += offset;
                }
            }
            break; 
        case 'king':


            // Check all 8 directions around the king
            const possibleOffsets = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]];
            for (const [rowOffset, colOffset] of possibleOffsets) {
                let newRow = row + rowOffset;
                let newCol = col + colOffset;

                if (inBounds(newRow, newCol)) {
                    if (gameScene.data.boardState[newRow][newCol].type == 'empty' || 
                    gameScene.data.boardState[newRow][newCol].color !== color) { 
                            validMoves.push({ row: newRow, col: newCol }); 
                    }
                }
            }
            break;     
        case 'pawn':
            
            //console.log(direction)

            // Forward Moves
            const oneStepForward = row + direction;

            //console.log(color)
            //console.log(direction)
            //console.log(row)
            //console.log(oneStepForward)
            //console.log(boardState[oneStepForward][col])
            //console.log(boardState)
            if (inBounds(oneStepForward, col) && gameScene.data.boardState[oneStepForward][col].type == 'empty') {
                validMoves.push({ row: oneStepForward, col: currentCol });
            }

            const twoStepsForward = row + (2 * direction);

            if (inBounds(twoStepsForward, col) && gameScene.data.boardState[twoStepsForward][col].type == 'empty' && 
                piece.data.list.startRow === row) { // Check if it's the first move
                    validMoves.push({ row: twoStepsForward, col: currentCol });
            }

            // Diagonal Captures
            for (const colOffset of [-1, 1]) { // Check left and right diagonals
                const diagRow = row + direction;
                const diagCol = col + colOffset;
                //console.log(game.data.boardState[diagRow][diagCol])
                if (inBounds(diagRow, diagCol) && 
                    gameScene.data.boardState[diagRow][diagCol].type != 'empty' && 
                    gameScene.data.boardState[diagRow][diagCol].data.list.color != piece.data.list.color) {
                        validMoves.push({ row: diagRow, col: diagCol });
                }
            } 
            break;
        default:
            console.error("Unknown piece type:", piece.type);
    }
    //console.log(validMoves)

    return validMoves;
}

// Helper function to check if coordinates are within board bounds
function inBounds(row, col) {
    //console.log('Inbounds: ' + (row >= 0 && row < 12 && col >= 0 && col < 8))
    //console.log('Row: ' + row)
    //console.log('Column: ' + col)
    return row >= 0 && row < 12 && col >= 0 && col < 8;
}


// (Potentially)
function updateBlocking(boardState) { 
   // ... Logic to update blocking information ...
}

function switchTurns() {
    if (currentPlayer == player1){
        currentPlayer = player2
    } else {
        currentPlayer = player1
    }
    updateTurnDisplay();
    console.log("Successful move, switching turns")
        
}

function handleStartTurn(boardState) { // Assuming currentPlayer is a Player object

    let income = 0
    let vp = 0
    currentPlayer.coinIncome = 0
    currentPlayer.pointIncome = 0

    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 8; col++) {
            const square = gameScene.data.boardState[row][col];
            // console.log(square)
            // console.log(piece.color)
            // console.log(currentPlayer.color)
            if (square.type != 'empty' && square.color == currentPlayer.color) { // Check for current player's piece
                const squareColor = boardColors[row][col]; 
                if (squareColor == 'yellow') {
                    //add victoryPoints
                    currentPlayer.victoryPoints += yellowVal;
                    vp += yellowVal
                    currentPlayer.pointIncome += yellowVal;
                } else if (squareColor == 'green') {
                    //add coins
                    currentPlayer.coins += greenVal;
                    income += greenVal
                    currentPlayer.coinIncome += greenVal;
                }
            }
        }
    }
    updatePlayerStatsUI(); // Update the UI with new stats


}

function handleEndTurn(boardState) { // Assuming currentPlayer is a Player object

    currentPlayer.coinIncome = 0
    currentPlayer.pointIncome = 0

    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 8; col++) {
            const square = gameScene.data.boardState[row][col];
            // console.log(square)
            // console.log(piece.color)
            // console.log(currentPlayer.color)
            if (square.type != 'empty' && square.color == currentPlayer.color) { // Check for current player's piece
                const squareColor = boardColors[row][col]; 
                if (squareColor == 'yellow') {
                    //add victoryPoints income
                    currentPlayer.pointIncome += yellowVal;
                } else if (squareColor == 'green') {
                    //add coins income
                    currentPlayer.coinIncome += greenVal;
                }
            }
        }
    }
    updatePlayerStatsUI(); // Update the UI with new stats


}

function updatePlayerStatsUI() {
    const player1VP = document.getElementById('player1-vp');
    const player2VP = document.getElementById('player2-vp');
    const player1Coins = document.getElementById('player1-coins');
    const player2Coins = document.getElementById('player2-coins');
    const player1CoinIncome = document.getElementById('player1-coin-income');
    const player2CoinIncome = document.getElementById('player2-coin-income');
    const player1VPIncome = document.getElementById('player1-vp-income');
    const player2VPIncome = document.getElementById('player2-vp-income');
    // console.log(player1VP)
    // console.log(player1VP.textContent)

    player1VP.textContent = allPlayers[0].victoryPoints; // Update player 1's VP
    player2VP.textContent = allPlayers[1].victoryPoints; // Update player 2's VP
    player1Coins.textContent = allPlayers[0].coins; 
    player2Coins.textContent = allPlayers[1].coins; 
    player1CoinIncome.textContent = allPlayers[0].coinIncome;
    player2CoinIncome.textContent = allPlayers[1].coinIncome;
    player1VPIncome.textContent = allPlayers[0].pointIncome;
    player2VPIncome.textContent = allPlayers[1].pointIncome;


}

function createBaseColorBoard() {
    const board = [
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'green', 'green', 'green', 'green', 'regular', 'regular'],
        ['regular', 'regular', 'green', 'yellow', 'yellow', 'green', 'regular', 'regular'],
        ['regular', 'regular', 'green', 'yellow', 'yellow', 'green', 'regular', 'regular'],
        ['regular', 'regular', 'green', 'green', 'green', 'green', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular'],
        ['regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular']
    ];
    return board;
}

function buyBackPiece(player, piece) {
    //console.log(this)
    pieceType = piece.type
    const pieceCost = getPieceValue(pieceType);
    console.log('Piece Cost: ' + pieceCost)
    const originalPosition = getOriginalPosition(piece);
    console.log(originalPosition)

    // Check if any original position is open
    
    const row = piece.data.list.startRow;
    const col = piece.data.list.startCol;
    //console.log(game.data.boardState)
    //console.log(game.data.boardState)

    if (player.color != piece.data.list.color) {
        console.log('That is not the current players piece. Buy not allowed')
        return false
    }

    if (gameScene.data.boardState[row][col].type == 'empty') { // Original square is open
        //console.log('test')
        if (player.coins >= pieceCost) {
            // ... Logic to update boardState, deduct coins 
            player.coins = player.coins - pieceCost
            console.log(gameScene)
            // console.log(piece)
            gameScene.data.boardState[row][col] = piece
            updateBuybackUI(gameScene, piece); 
            return true; 
        } else {
            // ... Handle not enough coins 
            console.log('not enough coins to buy: ' + piece.data.list.id)
            return false;
        }
    } else {
        console.log("Piece's original spot is not empty")
        //console.log(originalPiecePositions)
    }
    
    // ... Handle no open starting squares for that piece type 
    return false;
}

function setOriginalState(boardState) {
    let originalPieces = []
    let i = 0
    for(row = 0; row < 12; row++) {

        for(col = 0; col < 8; col++) {
            //console.log(boardState)
            if(boardState[row][col].type != 'empty') {
                originalPieces.push(chessPieceSprites[i])
                i++
            }
        }

    }
    originalPiecePositions = originalPieces;
    //console.log(originalPiecePositions)
     //originalPiecePositions = JSON.parse(JSON.stringify(originalPieces));
}

function getPieceValue(pieceType) {
    const pieceValues = {
        'pawn': 1,
        'knight': 3,
        'bishop': 3,
        'rook': 5,
        'queen': 9,
        'king': 10 // Or some very high value to represent that kings cannot be bought back
    };

    return pieceValues[pieceType] || 0; // Return 0 if the piece type is not recognized
}

function getOriginalPosition(piece) {
    //console.log(piece)
    const currentBoard = gameScene.data.boardState
    //console.log(currentBoard)
    //console.log(game)
    //console.log(originalPiecePositions)
    console.log('Getting original position of: ' + piece.data.list.id)
    
    for(el of originalPiecePositions)
    {
        // console.log(piece.data.list.id)
        //console.log(el.data.list.id)
        
        
        if (piece.data.list.id == el.data.list.id){
            return [el.data.list.startRow, el.data.list.startCol]
        }
    } 
    
        
    
}

function updateBuybackUI(scene, piece) {
    console.log('Updating UI')
    const col = piece.data.list.startCol
    const row = piece.data.list.startRow
    //console.log(piece)



    let spriteName = piece.type.charAt(0).toUpperCase() + piece.type.slice(1) + '_' + piece.data.list.color.charAt(0).toUpperCase() + piece.data.list.color.slice(1);
    
    //console.log(spriteName)
    const x = col * squareSize + squareSize/2;
    const y = row * squareSize + squareSize/2;
    //console.log(this.Phaser.Game)
    // console.log(game)
    // console.log(this)
    const sprite = scene.add.sprite(x, y, spriteName);
    sprite.type = piece.type
    sprite.data = new Phaser.Data.DataManager(sprite);
    //console.log(sprite);
    //console.log(sprite.texture);
    sprite.setInteractive();
    //console.log(sprite)
    sprite.data.set('row', row); // Store row and column 
    sprite.data.set('col', col);
    sprite.data.set('startRow', row)
    sprite.data.set('color', piece.color)

    // if (pieceIds.includes(spriteName)) {
    //     
    //     console.log(spriteName + ' created')
    //     pieceCount++
    // }
    spriteName = spriteName + pieceCount
    pieceCount++


    sprite.data.set('id', spriteName)
    scene.input.setDraggable(sprite)

    gameScene.data.boardState[row][col].color = piece.color

    // 3. Store sprite (or an object containing the sprite) in chessPieceSprites
    chessPieceSprites.push(sprite); 
    pieceIds.push(spriteName)
    //console.log(boardState)

}

function populateBuybackUI() {
    const buybackPiecesContainer = document.getElementById('piece-buttons-container');
    //buybackPiecesContainer.innerHTML = ''; // Clear existing elements
    //console.log(originalPiecePositions)
    //console.log(this)
    //console.log(originalPiecePositions)
  
    for (const piece of originalPiecePositions) {
        //console.log(piece)
        const button = document.createElement('button');
        button.style.backgroundImage = `url(${getImagePath(piece.type, piece.data.list.color)})`;

        // Optional: Set other button properties (size, class, etc.)
        button.classList.add('piece-button');

        // Add click handler 
        
        //button.addEventListener('click', () => handleBuybackClick.bind(this, piece)); 
        //button.addEventListener('click', handleBuybackClick.bind(this, piece));
        button.addEventListener('click', () => handleBuybackClick(piece));

        buybackPiecesContainer.appendChild(button);
      }

}
  
// Helper function to get the image path
function getImagePath(type, color) {
    //console.log(type)
    const path = 'assets/' + type.charAt(0).toUpperCase() + type.slice(1) + '_' + color.charAt(0).toUpperCase() + color.slice(1) + '.png';
    return path; 
}

function handleBuybackClick(event, boardState) {
    //console.log(event)
    const pieceType = event.type;
    const color = event.data.list.color;
    const pieceKey = event.data.list.id
    let piece = null
    for (el of originalPiecePositions) {
        //console.log(el)
        if (el.data.list.id == pieceKey){
            piece = el
        }
    }
    //console.log('Clicked!!')
    //console.log(game)

    const player = currentPlayer; // Assuming you have the current player
    if (buyBackPiece(player, piece) == true) {
        // Update buyback UI if successful
        //updateBuybackUI(piece);
        console.log('Buy was successful')
        switchTurns()
        handleStartTurn()
        return true
    } else {
        // Provide feedback if unsuccessful (e.g., not enough coins)
        console.log('Buy unsuccsessful')
    }
}

function oppColor() {
    if(currentPlayer.color == 'white') {
        return 'black'
    } else {
        return 'white'
    }
}



function updateTurnDisplay() {
    //console.log(turnDisplay)
    const str = currentPlayer.color.charAt(0).toUpperCase() + currentPlayer.color.slice(1);
    turnDisplay.textContent = `${str}'s Turn`;
}

// Call updateTurnDisplay initially
//updateTurnDisplay();

    

function cloneSprite(sprite) {
    // Create a new sprite object manually.
    // You need to copy over the properties you care about.
    const clonedSprite = new Sprite(sprite.x, sprite.y, sprite.texture);
    // Copy other properties as needed
    return clonedSprite;
}

document.addEventListener('DOMContentLoaded', () => {
    addInfoPanel()
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const socket = io();

    

    if (sessionId) {
        socket.emit('joinSession', sessionId);
        playerColor = currentPlayer.color
        socket.emit('playerColor', playerColor); // Inform the player of their color
        
          
    } else {
        console.error('No session ID provided.');
    }
});

function addInfoPanel() {
    const infoIcon = document.querySelector('.info-icon');
    const dropdownContent = document.querySelector('.dropdown-content');

    function renderPage(pageIndex) {
        dropdownContent.innerHTML = ''; // Clear previous content

        const title = document.createElement('h3');
        const paragraph = document.createElement('p');
        
        // Dynamically set the content based on the pageIndex
        switch (pageIndex) {
            case 0:
                title.textContent = "How do you Win?";
                paragraph.innerHTML = "Get 20 victory points! <br><br> + Earn 1 victory point for every Yellow square you control<br><br> + Controling a square means one of your pieces are on it at the begining of your turn";
                break;
            case 1:
                title.textContent = "Buying Pieces?";
                paragraph.innerHTML = "+ Earn 0.5 coins for every green square you control.<br><br>" +  "+ Buy a piece from the shop to the right!<br><br>" + "+ Each piece costs as much as its corresponding chess value.";
                break;
            case 2: // New Page
                title.textContent = "Moving and Capturing";
                paragraph.innerHTML = "+ All legal chess moves are allowed except casteling and en-pacent. <br><br>+ no points or coins are awarded for captures, but that may change in a future update.";
                break;
            default:
                title.textContent = "Page Title Not Found";
                paragraph.textContent = "No additional content available.";
                break;
        }

        dropdownContent.appendChild(title);
        dropdownContent.appendChild(paragraph);

        // Navigation container for page switching
        const navContainer = document.createElement('div');
        navContainer.style.textAlign = 'center';

        if (pageIndex > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => { renderPage(pageIndex - 1); };
            navContainer.appendChild(prevBtn);
        }

        // Update the condition to reflect the new total number of pages
        if (pageIndex < 3 - 1) { // Now assuming 3 pages
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.onclick = () => { renderPage(pageIndex + 1); };
            navContainer.appendChild(nextBtn);
        }

        dropdownContent.appendChild(navContainer);
    }

    if (infoIcon && dropdownContent) {
        infoIcon.addEventListener('click', function() {
            dropdownContent.classList.toggle('show');
            if (dropdownContent.classList.contains('show') && !dropdownContent.hasChildNodes()) {
                renderPage(0); // Initially render the first page
            }
        });
    }
}

function sendGameAction(action) {
    const sessionId = new URLSearchParams(window.location.search).get('session');
    if (sessionId) {
        socket.emit('gameAction', { sessionId, action });
    } else {
        console.error('Session ID is missing, cannot send action');
    }
}

