import reducer from "./reducer";
import {
  IGameState,
  withChangedSquare,
  Color,
  Card,
  IDeck,
  getSquare,
  cardCounts,
  deckSize,
} from "../types/index";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";
import { sample } from "underscore";

const initialState: IGameState = {
  board: null,
  decks: null,
  counts: null,
};

const initialReducer = reducer<Partial<IGameState>>(initialState, on => {
  on(actions.newGame, (state, action) => {
    let board = {
      numCols: 5,
      numRows: 4,
      squares: [],
    };
    board.squares.length = board.numCols * board.numRows;

    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const square = {
          color: Color.Neutral,
          card: Card.None,
        };

        board = withChangedSquare(board, col, row, square);
      }
    }

    const generateDeck = (): IDeck => {
      const allCards: Card[] = [];
      for (const card of Object.keys(cardCounts)) {
        const count = cardCounts[card];
        for (let i = 0; i < count; i++) {
          allCards.push(parseInt(card, 10) as Card);
        }
      }

      return {
        cards: sample(allCards, deckSize),
      };
    };

    return {
      board,
      decks: {
        [Color.Blue]: generateDeck(),
        [Color.Red]: generateDeck(),
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

    state = {
      ...state,
      decks: {
        ...state.decks,
        [player]: changeDeck(state.decks[player]),
      },
    };

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
