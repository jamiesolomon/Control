const pieceTypes = {
    pawn: { 
        type: 'pawn', 
        color: 'white', 
        moves: [
           { direction: 'forward', maxSteps: 1 },
           { direction: 'forward', maxSteps: 2, firstMoveOnly: true }, 
           { direction: 'diagonal', maxSteps: 1, captureOnly: true }
       ] 
    }, 
    knight: {
        type: 'knight',
        color: 'white',
        moves: [
            { direction: 'L-shape', maxSteps: 1 } // Detail L-shape movement below
        ]
    },
    bishop: {
        type: 'bishop',
        color: 'white',
        moves: [
            { direction: 'diagonal', maxSteps: 7 } // Up to board boundary
        ]
    },
    rook: {
        type: 'rook',
        color: 'white',
        moves: [
            { direction: 'horizontal', maxSteps: 7 }, // Up to board boundary
            { direction: 'vertical', maxSteps: 7 }  // Up to board boundary
        ]
    },
    queen: {
        type: 'queen',
        color: 'white',
        moves: [
            { direction: 'horizontal', maxSteps: 7 }, 
            { direction: 'vertical', maxSteps: 7 },
            { direction: 'diagonal', maxSteps: 7 }
        ]
    },
    king: {
        type: 'king',
        color: 'white',
        moves: [
            { direction: 'horizontal', maxSteps: 1 }, 
            { direction: 'vertical', maxSteps: 1 },
            { direction: 'diagonal', maxSteps: 1 }
        ]
    }
};

module.exports = pieceTypes;

