import reducer from "./reducer";
import {
  IGameState,
  withChangedSquare,
  Color,
  Suit,
  IDeck,
  getSquare,
  cardCounts,
  deckSize,
  ICard,
  makeNeutralSquare,
  getCardAreaType,
  forEachAreaSquare,
  swapColor,
} from "../types/index";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";
import { sample, map } from "underscore";
import { genid } from "../util/genid";

const initialState: IGameState = {
  board: null,
  decks: null,
  counts: null,
};

const initialReducer = reducer<Partial<IGameState>>(initialState, on => {
  on(actions.newGame, (state, action) => {
    let board = {
      numCols: 6,
      numRows: 4,
      squares: [],
    };
    board.squares.length = board.numCols * board.numRows;

    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const square = makeNeutralSquare();
        board = withChangedSquare(board, col, row, square);
      }
    }

    const generateDeck = (): IDeck => {
      const suitPool: Suit[] = [];
      for (const card of Object.keys(cardCounts)) {
        const count = cardCounts[card];
        for (let i = 0; i < count; i++) {
          suitPool.push(parseInt(card, 10) as Suit);
        }
      }

      return {
        cards: map(sample<Suit>(suitPool, deckSize), (suit): ICard => ({
          id: genid(),
          suit,
        })),
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
    let card: ICard = null;
    const changeDeck = (deck: IDeck) => {
      card = deck.cards[index];
      const newCards = [...deck.cards];
      newCards.splice(index, 1);
      newCards.length = deckSize;
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

    let board = state.board;

    const previousSquare = getSquare(board, col, row);
    if (card.suit === Suit.Necromancer) {
      console.log("necromancing!");
      if (previousSquare.card) {
        console.log("necromancing ", previousSquare.card);
        let newCards = [...state.decks[player].cards];
        for (let i = 0; i < newCards.length; i++) {
          if (!newCards[i]) {
            console.log("putting it at", i);
            newCards[i] = previousSquare.card;
            break;
          }
        }
        state = {
          ...state,
          decks: {
            ...state.decks,
            [player]: {
              ...state.decks[player],
              cards: newCards,
            },
          },
        };
      }

      board = withChangedSquare(board, col, row, makeNeutralSquare());
    } else {
      board = withChangedSquare(board, col, row, {
        card,
        color: player,
      });

      const areaType = getCardAreaType(previousSquare.card);
      forEachAreaSquare(board, col, row, areaType, (col, row, square) => {
        switch (card.suit) {
          case Suit.Goblin:
            // destroy all the things!
            board = withChangedSquare(board, col, row, makeNeutralSquare());
            break;
          case Suit.Priest:
            // swap all the things!
            board = withChangedSquare(board, col, row, {
              card: square.card,
              color: swapColor(square.color),
            });
            break;
        }
      });
    }

    state = {
      ...state,
      board,
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
