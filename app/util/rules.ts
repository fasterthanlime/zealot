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
  Color,
  suitName,
  colorName,
} from "../types/index";
import { IPlayCardPayload } from "../actions/index";

export function isValidMove(
  state: IGameState,
  play: IPlayCardPayload,
): boolean {
  const { board } = state;
  let card = state.decks[play.player].cards[play.index];
  const sq = getSquare(board, play.col, play.row);

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

export function computeBenefit(
  game1: IGameState,
  game2: IGameState,
  color: Color,
): number {
  const opponentColor = swapColor(color);
  const before =
    computeScore(game1, color) - computeScore(game1, opponentColor);
  const after = computeScore(game2, color) - computeScore(game2, opponentColor);

  const pointsGain = after - before;
  return -pointsGain; // since we want to minimize
}

function suitPotential(suit: Suit): number {
  switch (suit) {
    case Suit.Priest:
    case Suit.Goblin:
      return 3;

    case Suit.MarksmanL:
    case Suit.MarksmanR:
      return 2;

    case Suit.Necromancer:
    case Suit.Monk:
      return 1;
  }

  return 0;
}

export function computeScore(game: IGameState, color: Color): number {
  let score = 0;

  const { board } = game;
  for (let col = 0; col < board.numCols; col++) {
    for (let row = 0; row < board.numRows; row++) {
      const sq = getSquare(board, col, row);
      if (sq.card && sq.color === color) {
        score++;
      }
    }
  }

  let deckPotential = 0;
  let cards = game.decks[color].cards;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card) {
      deckPotential += suitPotential(card.suit);
    }
  }

  return score - deckPotential;
}

// AI stuff!

export interface IPotentialPlay {
  play: IPlayCardPayload;
  benefit: number;
}

function formatCard(card: ICard, color: Color): string {
  if (!card) {
    return "<empty>";
  }

  return `${colorName(color)} ${suitName(card.suit)}`;
}

export function printPlays(game: IGameState, plays: IPotentialPlay[]) {
  const { board, decks } = game;

  console.log(`best ${plays.length} plays considered: `);
  for (const play of plays) {
    const { col, row, index, player } = play.play;
    const card = decks[player].cards[index];
    const sq = getSquare(board, col, row);

    console.log(
      `${formatCard(card, player)} on ${formatCard(sq.card, sq.color)} at ${
        col
      },${row} for ${play.benefit}`,
    );
  }
}
