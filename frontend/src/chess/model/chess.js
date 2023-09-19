import {Chess} from 'chess.js'
//import * as Chess from 'chess.js'
//import {Chess} from '../../../node_modules/chess.js/src/chess';
import ChessPiece from './chesspiece'
import Square from './square'
// when indexing, remember: [y][x]. 
/**
 * If the player color is black, make sure to invert the board.
 */




class Game {
    constructor(thisPlayersColorIsWhite) {
        this.thisPlayersColorIsWhite = thisPlayersColorIsWhite // once initialized, this value should never change.
        // console.log("this player's color is white: " + this.thisPlayersColorIsWhite) 
        this.chessBoard = this.makeStartingBoard() // the actual chessBoard
        this.chess = new Chess()

        this.toCoord = thisPlayersColorIsWhite ? {
            0:10, 1:9, 2:8, 3:7, 4:6, 5:5, 6:4, 7:3, 8:2, 9:1
        } : {
            0:1, 1:2, 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:10
        };
        
        this.toAlphabet = thisPlayersColorIsWhite ? {
            0:"a", 1:"b", 2: "c", 3: "d", 4: "e", 5: "f", 6: "g", 7: "h"
        } : {
            0:"h", 1:"g", 2: "f", 3: "e", 4: "d", 5: "c", 6: "b", 7: "a"
        }

        this.toCoord2 = thisPlayersColorIsWhite ? {
            10:0, 9:1, 8:2, 7:3, 6:4, 5:5, 4:6, 3:7, 2:8, 1:9
        } : {
            1:0, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:7, 9:8, 10:9
        };
        
        this.toAlphabet2 = thisPlayersColorIsWhite ? {
            "a":0, "b":1, "c":2, "d":3, "e":4, "f":5, "g":6, "h":7
        } : {
            "h":0, "g":1, "f":2, "e":3, "d":4, "c":5, "b":6, "a":7
        }

        this.nQueens = 1
    }

    getBoard() {
        return this.chessBoard
    }

    // nextPlayersTurn() {
    //     this.isWhitesTurn = !this.isWhitesTurn
    // }

    setBoard(newBoard) {
        this.chessBoard = newBoard
    }

    movePiece(pieceId, to, isMyMove) {

        const to2D_y = isMyMove ? {
            105:0, 195:1, 285: 2, 375: 3, 465: 4, 555: 5, 645: 6, 735: 7, 825: 8, 915: 9
        } : {
            105:9, 195:8, 285: 7, 375: 6, 465: 5, 555: 4, 645: 3, 735: 2, 825: 1, 915: 0
        };

        const to2D_x = isMyMove ? {
            105:0, 195:1, 285: 2, 375: 3, 465: 4, 555: 5, 645: 6, 735: 7
        } : {
            105:7, 195:6, 285: 5, 375: 4, 465: 3, 555: 2, 645: 1, 735: 0 
        };
    
        var currentBoard = this.getBoard();
        const pieceCoordinates = this.findPiece(currentBoard, pieceId);
        
        // can't find piece coordinates (piece doesn't exist on the board)
        if (!pieceCoordinates) {
            return;
        }
    
        const y = pieceCoordinates[1];
        const x = pieceCoordinates[0];
    
        // new coordinates
        const to_y = to2D_y[to[1]];
        const to_x = to2D_x[to[0]];

        console.log("Attempting to move from", [x, y], "to", [to_x, to_y]);
    
        const originalPiece = currentBoard[y][x].getPiece();
    
        if (y === to_y && x === to_x) {
            return "moved in the same position.";
        }

        /**
         * In order for this method to do anything meaningful, 
         * the 'reassign const' line of code must run. Therefore, 
         * for it to run, we must check first that the given move is valid. 
         */

        const isPromotion = this.isPawnPromotion(to, pieceId[1])

        console.log("Moving Piece: ", pieceId[1])
        // const moveAttempt = !isPromotion ? this.chess.move(      
        //     {
        //         from: this.toChessMove([x, y], to2D_x, to2D_y),
        //         to: this.toChessMove(to, to2D_x, to2D_y),
        //         piece: pieceId[1]}) 
        //     : 
        //     this.chess.move({
        //         from: this.toChessMove([x, y], to2D_x, to2D_y),
        //         to: this.toChessMove(to, to2D_x, to2D_y),
        //         piece: pieceId[1],
        //         promotion: 'q'
        //     })


        // TODO: create a move object here without validating
        const moveAttempt = !isPromotion ? this.chess.move(      
            {
                from: this.toChessMove([x, y], to2D_x, to2D_y),
                to: this.toChessMove(to, to2D_x, to2D_y),
                piece: pieceId[1]}) 
            : 
            this.chess.move({
                from: this.toChessMove([x, y], to2D_x, to2D_y),
                to: this.toChessMove(to, to2D_x, to2D_y),
                piece: pieceId[1],
                promotion: 'q'
            })



         console.log(moveAttempt)
        // console.log(isPromotion)

        if (moveAttempt === null) {
            return "invalid move"
        }


        if (moveAttempt.flags === 'e') {
            console.log('moveAttempt.flags === \'e\'')
            const move = moveAttempt.to 
            const x = this.toAlphabet2[move[0]]
            let y
            if (moveAttempt.color === 'w') {
                y = parseInt(move[1], 10) - 1
            } else {
                y = parseInt(move[1], 10) + 1 
            }
            currentBoard[this.toCoord2[y]][x].setPiece(null)
        }



        // Check castling
        const castle = this.isCastle(moveAttempt)
        if (castle.didCastle) {
            /**
             *  The main thing we are doing here is moving the right rook
             *  to the right position. 
             * 
             * - Get original piece by calling getPiece() on the original [x, y]
             * - Set the new [to_x, to_y] to the original piece
             * - Set the original [x, y] to null
             */

            const originalRook = currentBoard[castle.y][castle.x].getPiece()
            currentBoard[castle.to_y][castle.to_x].setPiece(originalRook)
            currentBoard[castle.y][castle.x].setPiece(null)
        }


        // ___actually changing the board model___

        console.log("to_y:", to_y);
        console.log("to_x:", to_x);
        console.log("currentBoard:", currentBoard);

        const reassign = isPromotion ? currentBoard[to_y][to_x].setPiece(
            new ChessPiece(
                'queen', 
                false, 
                pieceId[0] === 'w' ? 'white' : 'black', 
                pieceId[0] === 'w' ? 'wq' + this.nQueens : 'bq' + this.nQueens))
            : currentBoard[to_y][to_x].setPiece(originalPiece)

        if (reassign !== "user tried to capture their own piece") {
            currentBoard[y][x].setPiece(null)
        } else {
            return reassign
        }

        // ___actually changing the board model___


        const checkMate = this.chess.in_checkmate() ? " has been checkmated" : " has not been checkmated"
        console.log(this.chess.turn() + checkMate)
        if (checkMate === " has been checkmated") {
            return this.chess.turn() + checkMate
        }
        // changes the fill color of the opponent's king that is in check
        const check = this.chess.in_check() ? " is in check" : " is not in check"
        console.log(this.chess.turn() + check)
        if (check === " is in check") {
            return this.chess.turn() + check
        }

        console.log(currentBoard)
        // update board
        this.setBoard(currentBoard)
    }



    isCastle(moveAttempt) {
        /**
         * Assume moveAttempt is legal. 
         * 
         * {moveAttempt} -> {boolean x, y to_x, to_y} 
         * 
         * returns if a player has castled, the final position of 
         * the rook (to_x, to_y), and the original position of the rook (x, y)
         * 
         */


        const piece = moveAttempt.piece
        const move = {from: moveAttempt.from, to: moveAttempt.to}

        // DONE: changed 8s to 10s
        const isBlackCastle = ((move.from === 'e1' && move.to === 'g1') || (move.from === 'e1' && move.to === 'c1')) 
        const isWhiteCastle = (move.from === 'e10' && move.to === 'g10') || (move.from === 'e10' && move.to === 'c10')
        

        if (!(isWhiteCastle || isBlackCastle) || piece !== 'k') {
            return {
                didCastle: false
            }
        }

        let originalPositionOfRook
        let newPositionOfRook

        if ((move.from === 'e1' && move.to === 'g1')) {
            originalPositionOfRook = 'h1'
            newPositionOfRook = 'f1'
        } else if ((move.from === 'e1' && move.to === 'c1')) {
            originalPositionOfRook = 'a1'
            newPositionOfRook = 'd1'
        } // DONE: changed 8s to 10s
        else if ((move.from === 'e10' && move.to === 'g10')) {
            originalPositionOfRook = 'h10'
            newPositionOfRook = 'f10'
        } else { // e10 to c10
            originalPositionOfRook = 'a10'
            newPositionOfRook = 'd10'
        }   

    
        return {
            didCastle: true, 
            x: this.toAlphabet2[originalPositionOfRook[0]], 
            y: this.toCoord2[originalPositionOfRook[1]], 
            to_x: this.toAlphabet2[newPositionOfRook[0]], 
            to_y: this.toCoord2[newPositionOfRook[1]]
        }
    }

    // DONE: Must change 735 to a 915 due to 2 rows being added (each row is 90 pixes)
    isPawnPromotion(to, piece) {
        const res = piece === 'p' && (to[1] === 105 || to[1] === 915)
        if (res) {
            this.nQueens += 1
        }
        return res
    }


    toChessMove(finalPosition, to2D_x, to2D_y) {
        const move_x = this.toAlphabet[to2D_x[finalPosition[0]]];
        const move_y = this.toCoord[to2D_y[finalPosition[1]]];
        console.log('--------- toChessMove() --------')
        console.log('move_x: ' + move_x)
        console.log('move_y: ' + move_y)
        console.log('move_y + move_y: ' + move_x + move_y)
        return move_x + move_y;
    }
    
    // DONE changed i to 10 instead of 8
    findPiece(board, pieceId) {
        console.log('Board: ' + board)
        console.log('PieceId: ' + pieceId)
        // ChessBoard, String -> [Int, Int]
      //  console.log("piecetofind: " + pieceId)
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 8; j++) {
                console.log('(' + 'i:' + i + ',' + 'j:' + j + ') ---> ' + board[i][j].getPieceIdOnThisSquare())
                if (board[i][j].getPieceIdOnThisSquare() === pieceId) {
                    return [j, i]
                }
            }
        }
    }

    makeStartingBoard() {
        const backRank = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
        var startingChessBoard = []
        // DONE: CHECK: Makde i 10 instead of 8 to add 2 more rows
        for (var i = 0; i < 10; i++) {
            startingChessBoard.push([])
            for (var j = 0; j < 8; j++) {
                // j is horizontal
                // i is vertical
                const coordinatesOnCanvas = [((j + 1) * 90 + 15), ((i + 1) * 90 + 15)]
                const emptySquare = new Square(j, i, null, coordinatesOnCanvas)
                
                startingChessBoard[i].push(emptySquare)
                console.log('Added square: ' + j + ',' + i)
            }
        }
        const whiteBackRankId = ["wr1", "wn1", "wb1", "wq1", "wk1", "wb2", "wn2", "wr2"]
        const blackBackRankId = ["br1", "bn1", "bb1", "bq1", "bk1", "bb2", "bn2", "br2"]
        for (var j = 0; j < 10; j += 9) {
            for (var i = 0; i < 8; i++) {
                if (j == 0) {
                    // top
                    //console.log(backRank[i])
                    startingChessBoard[j][this.thisPlayersColorIsWhite ? i : 7 - i].setPiece(new ChessPiece(backRank[i], false, this.thisPlayersColorIsWhite ? "black" : "white", this.thisPlayersColorIsWhite ? blackBackRankId[i] : whiteBackRankId[i]))
                    startingChessBoard[j + 1][this.thisPlayersColorIsWhite ? i : 7 - i].setPiece(new ChessPiece("pawn", false, this.thisPlayersColorIsWhite ? "black" : "white", this.thisPlayersColorIsWhite ? "bp" + i : "wp" + i))
                } else {
                    // bottom
                    startingChessBoard[j - 1][this.thisPlayersColorIsWhite ? i : 7 - i].setPiece(new ChessPiece("pawn", false, this.thisPlayersColorIsWhite ? "white" : "black", this.thisPlayersColorIsWhite ? "wp" + i : "bp" + i))
                    startingChessBoard[j][this.thisPlayersColorIsWhite ? i : 7 - i].setPiece(new ChessPiece(backRank[i], false, this.thisPlayersColorIsWhite ? "white" : "black", this.thisPlayersColorIsWhite ? whiteBackRankId[i] : blackBackRankId[i]))
                }
            }
        }
        console.log(' -------- Makeing Starting chess board --------\n' + startingChessBoard)
        return startingChessBoard
    }
}

export default Game