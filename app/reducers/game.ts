import reducer from "./reducer";
import {
  IGameState,
  withChangedSquare,
  Color,
  Card,
  IDeck,
  getSquare,
} from "../types/index";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";

const initialState: IGameState = {
  board: null,
  deckRed: null,
  deckBlue: null,
  counts: null,
};

const initialReducer = reducer<Partial<IGameState>>(initialState, on => {
  on(actions.newGame, (state, action) => {
    let board = {
      numCols: 5,
      numRows: 5,
      squares: [],
    };
    board.squares.length = board.numCols * board.numRows;

    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const square = {
          color: Color.Neutral,
          card: Card.None,
        };
        if (Math.random() >= 0.8) {
          square.card = Math.floor(1 + Math.random() * (Card.MAX_CARD - 1));
          square.color = Math.random() >= 0.5 ? Color.Red : Color.Blue;
        }

        board = withChangedSquare(board, col, row, square);
      }
    }

    return {
      board,
      deckBlue: {
        cards: [Card.Goblin, Card.Peasant, Card.Peasant, Card.MarksmanL],
      },
      deckRed: {
        cards: [Card.Peasant, Card.Peasant, Card.Peasant, Card.Peasant],
      },
    };
  });

  on(actions.playCard, (state, action) => {
    const { player, index, col, row } = action.payload;

    let card = Card.None;
    const changeDeck = (deck: IDeck) => {
      card = deck.cards[index];
      const newCards = [...deck.cards];
      newCards.splice(index, 1);
      return {
        ...deck,
        cards: newCards,
      };
    };

    if (player === Color.Red) {
      state = {
        ...state,
        deckRed: changeDeck(state.deckRed),
      };
    } else {
      state = {
        ...state,
        deckBlue: changeDeck(state.deckBlue),
      };
    }

    state = {
      ...state,
      board: withChangedSquare(state.board, col, row, {
        card,
        color: player,
      }),
    };

    return state;
  });
});

export default derivedReducer(initialReducer, (state: IGameState) => {
  if (!state || !state.board) {
    return state;
  }

  const { board } = state;
  let counts = {
    [Color.Red]: 0,
    [Color.Blue]: 0,
  };

  for (let col = 0; col < board.numCols; col++) {
    for (let row = 0; row < board.numRows; row++) {
      const square = getSquare(board, col, row);
      if (square) {
        if (counts.hasOwnProperty(square.color)) {
          counts[square.color]++;
        }
      }
    }
  }

  return {
    ...state,
    counts,
  };
});
