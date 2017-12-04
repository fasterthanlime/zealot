import reducer from "./reducer";
import {
  IGameState,
  withChangedSquare,
  Color,
  Suit,
  getSquare,
  cardCounts,
  makeNeutralSquare,
  IDeal,
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
      numCols: 5,
      numRows: 3,
      squares: [],
    };
    board.squares.length = board.numCols * board.numRows;

    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const square = makeNeutralSquare();
        board = withChangedSquare(board, col, row, square);
      }
    }

    const generateDeck = (color: Color): IDeal[] => {
      const suitPool: Suit[] = [];
      for (const card of Object.keys(cardCounts)) {
        const count = cardCounts[card];
        for (let i = 0; i < count; i++) {
          suitPool.push(parseInt(card, 10) as Suit);
        }
      }
      return map(sample<Suit>(suitPool, deckSize), (suit): IDeal => ({
        color,
        card: {
          id: genid(),
          suit,
        },
      }));
    };

    let aiDeck: IDeal[] = [
      {
        color: Color.Red,
        card: {
          id: genid(),
          suit: Suit.MarksmanR,
        },
      },
      {
        color: Color.Red,
        card: {
          id: genid(),
          suit: Suit.Priest,
        },
      },
    ];

    let myDeck: IDeal[] = [
      {
        color: Color.Blue,
        card: {
          id: genid(),
          suit: Suit.Peasant,
        },
      },
      {
        color: Color.Blue,
        card: {
          id: genid(),
          suit: Suit.Priest,
        },
      },
    ];

    let deals = shuffle<IDeal>([
      ...generateDeck(Color.Red),
      ...generateDeck(Color.Blue),
      // ...aiDeck,
      // ...myDeck,
    ]);

    return {
      ...initialState,
      board,
      dealPile: deals,
      trashPile: [],
      decks: {
        [Color.Blue]: { cards: [] },
        [Color.Red]: { cards: [] },
      },
    };
  });

  on(actions.dealNext, (state, action) => {
    let { dealPile, decks } = state;
    let [toDeal, ...rest] = dealPile;

    let deck = decks[toDeal.color];
    deck = {
      ...deck,
      cards: [...deck.cards, toDeal.card],
    };
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
      squares: map(board.squares, square => ({
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
