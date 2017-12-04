import reducer from "./reducer";
import {
  IGameState,
  withChangedSquare,
  Color,
  Suit,
  getSquare,
  cardCounts,
  ICard,
} from "../types/index";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";
import { sample, map, shuffle } from "underscore";
import { genid } from "../util/genid";
import { applyMove } from "../util/rules";

const initialState: IGameState = {
  board: null,
  decks: null,
  counts: null,
  dealPile: [],
  trashPile: [],
};

const initialReducer = reducer<IGameState>(initialState, on => {
  on(actions.newGame, (state, action) => {
    const deckSize = 12;
    let board = {
      numCols: 6,
      numRows: 4,
      cards: [],
    };
    board.cards.length = board.numCols * board.numRows;
    for (let i = 0; i < board.cards.length; i++) {
      board.cards[i] = null;
    }

    const generateDeck = (color: Color): ICard[] => {
      const suitPool: Suit[] = [];
      for (const card of Object.keys(cardCounts)) {
        const count = cardCounts[card];
        for (let i = 0; i < count; i++) {
          suitPool.push(parseInt(card, 10) as Suit);
        }
      }
      return map(sample<Suit>(suitPool, deckSize), (suit): ICard => ({
        id: genid(),
        color,
        suit,
      }));
    };

    let deals = shuffle<ICard>([
      ...generateDeck(Color.Red),
      ...generateDeck(Color.Blue),
    ]);

    return {
      ...initialState,
      board,
      dealPile: deals,
      trashPile: [],
      decks: {
        [Color.Blue]: [],
        [Color.Red]: [],
      },
    };
  });

  on(actions.dealNext, (state, action) => {
    let { dealPile, decks } = state;
    let [toDeal, ...rest] = dealPile;

    let deck = decks[toDeal.color];
    deck = [...deck, toDeal];
    decks = {
      ...decks,
      [toDeal.color]: deck,
    };

    return {
      ...state,
      decks,
      dealPile: rest,
    };
  });

  on(actions.invalidMove, (state, action) => {
    let board = state.board;

    const { col, row } = action.payload;
    const square = getSquare(board, col, row);
    board = withChangedSquare(board, col, row, {
      ...square,
    });

    return {
      ...state,
      board,
    };
  });

  on(actions.clearEffects, (state, action) => {
    let board = state.board;
    board = {
      ...board,
      cards: map(board.cards, square => ({
        ...square,
      })),
    };

    return {
      ...state,
      board,
    };
  });

  on(actions.cardPlayed, (state, action) => {
    return applyMove(state, action.payload);
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
