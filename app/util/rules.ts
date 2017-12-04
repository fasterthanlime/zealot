import {
  ICard,
  isCivilian,
  getSquare,
  IGameState,
  IDeck,
  ISquare,
  Suit,
  withChangedSquare,
  makeNeutralSquare,
  getCardAreaType,
  setSquare,
  forEachAreaSquare,
  swapColor,
} from "../types/index";
import { IPlayCardPayload } from "../actions/index";

export function isValidMove(
  game: IGameState,
  card: ICard,
  col: number,
  row: number,
): boolean {
  const { board } = game;
  const sq = getSquare(board, col, row);

  let valid = true;

  if (sq && sq.card) {
    if (isCivilian(card.suit)) {
      // civilians can only go on empty squares
      valid = false;
    }
  }
  return valid;
}

export function applyMove(
  state: IGameState,
  play: IPlayCardPayload,
): IGameState {
  const { player, index, col, row } = play;
  let card: ICard = null;
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

  let board = state.board;

  const previousSquare = getSquare(board, col, row);

  let trashPile = state.trashPile;
  let discard = (sq: ISquare) => {
    if (sq && sq.card) {
      trashPile = [
        ...trashPile,
        {
          color: sq.color,
          card: sq.card,
        },
      ];
    }
  };

  if (card.suit === Suit.Necromancer) {
    if (previousSquare.card) {
      let newCards = [...state.decks[player].cards, previousSquare.card];
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

    board = withChangedSquare(board, col, row, {
      ...makeNeutralSquare(),
    });
    trashPile = [...trashPile, { color: player, card }];
  } else {
    discard(previousSquare);

    board = withChangedSquare(board, col, row, {
      card,
      color: player,
    });

    const areaType = getCardAreaType(previousSquare.card);
    forEachAreaSquare(board, col, row, areaType, (col, row, square) => {
      switch (card.suit) {
        case Suit.Goblin:
          // destroy all the things!
          board = setSquare(board, col, row, oldSquare => {
            discard(oldSquare);
            return makeNeutralSquare();
          });
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
    trashPile,
  };

  return state;
}
