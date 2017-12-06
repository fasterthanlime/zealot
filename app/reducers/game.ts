import reducer from "./reducer";
import {
  IGameState,
  Color,
  Suit,
  cardCounts,
  ICard,
  specialCardCounts,
} from "../types/index";
import * as actions from "../actions";
import { sample, map, shuffle } from "underscore";
import { genid } from "../util/genid";
import { applyMove } from "../util/rules";

// const deckSize = 6;
// const specialDeckSize = 3;

const deckSize = 9;
const specialDeckSize = 0;

// const boardNumCols = 4;
// const boardNumRows = 3;

const boardNumCols = 2;
const boardNumRows = 2;

const initialState: IGameState = {
  board: {
    numCols: boardNumCols,
    numRows: boardNumRows,
    cards: new Array(boardNumCols * boardNumRows),
  },
  decks: {
    [Color.Red]: [],
    [Color.Blue]: [],
  },
  dealPile: [],
  trashPile: [],
};

export default reducer<IGameState>(initialState, on => {
  on(actions.newGame, (state, action) => {
    let board = {
      numCols: boardNumCols,
      numRows: boardNumRows,
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

      let normalCards = map(
        sample<Suit>(suitPool, deckSize),
        (suit): ICard => ({
          id: genid(),
          color,
          suit,
        }),
      );

      const specialSuitPool: Suit[] = [];
      for (const card of Object.keys(specialCardCounts)) {
        const count = specialCardCounts[card];
        for (let i = 0; i < count; i++) {
          specialSuitPool.push(parseInt(card, 10) as Suit);
        }
      }

      let specialCards = map(
        sample<Suit>(specialSuitPool, specialDeckSize),
        (suit): ICard => ({
          id: genid(),
          color,
          suit,
        }),
      );

      return shuffle<ICard>([...normalCards, ...specialCards]);
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

  on(actions.loadState, (state, action) => {
    return action.payload.game;
  });

  on(actions.dealAll, (state, action) => {
    let { dealPile, decks } = state;

    while (dealPile.length > 0) {
      let [toDeal, ...rest] = dealPile;

      let deck = decks[toDeal.color];
      deck = [...deck, toDeal];
      decks = {
        ...decks,
        [toDeal.color]: deck,
      };
      dealPile = rest;
    }

    return {
      ...state,
      decks,
      dealPile: [],
    };
  });

  on(actions.cardPlayed, (state, action) => {
    return applyMove(state, action.payload);
  });
});
