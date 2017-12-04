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
  return score;
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

function potentialGameLength(pg: IPotentialGame) {
  let length = 1;
  while (pg.next) {
    length++;
    pg = pg.next;
  }
  return length;
}

export function printGames(game: IGameState, pgs: IPotentialGame[]) {
  const { board, decks } = game;

  console.log(`best ${pgs.length} games considered: `);
  for (const pg of pgs) {
    const { col, row, index, player } = pg.play;
    const card = decks[player].cards[index];
    const sq = getSquare(board, col, row);

    console.log(
      `${formatCard(card, player)} on ${formatCard(sq.card, sq.color)} at ${
        col
      },${row}, ${Outcome[pg.outcome]} in ${potentialGameLength(pg)}`,
    );
  }
}

export enum Outcome {
  // from worst to best
  Loss = 0,
  Neutral = 1,
  Draw = 2,
  Win = 3,
}

export interface IPotentialGame {
  outcome: Outcome;
  game: IGameState;
  play: IPlayCardPayload;
  next: IPotentialGame;
}

import { random } from "underscore";

export function swapOutcome(outcome: Outcome): Outcome {
  if (outcome === Outcome.Win) {
    return Outcome.Loss;
  }
  if (outcome === Outcome.Loss) {
    return Outcome.Win;
  }
  return outcome;
}

export function computeOutcome(game: IGameState, player: Color): Outcome {
  for (const color of [Color.Red, Color.Blue]) {
    const { cards } = game.decks[color];
    if (cards.length > 0) {
      // cards left in play!
      return Outcome.Neutral;
    }
  }

  const ourScore = computeScore(game, player);
  const theirScore = computeScore(game, swapColor(player));
  if (ourScore < theirScore) {
    return Outcome.Win;
  }
  if (theirScore < ourScore) {
    return Outcome.Loss;
  }
  return Outcome.Draw;
}

export function simulateGame(game: IGameState, player: Color): IPotentialGame {
  const cards = game.decks[player].cards;
  if (cards.length === 0) {
    return null;
  }

  let tries = 20;
  let play: IPlayCardPayload;
  while (tries-- > 0) {
    let index = random(0, cards.length - 1);
    const col = random(0, game.board.numCols - 1);
    const row = random(0, game.board.numRows - 1);
    play = {
      col,
      row,
      index,
      player,
    };

    if (isValidMove(game, play)) {
      break;
    }
  }

  if (!play) {
    return null;
  }

  const nextGame = applyMove(game, play);
  const outcome = computeOutcome(nextGame, player);
  let pg: IPotentialGame = {
    outcome,
    game: nextGame,
    play,
    next: null,
  };

  if (outcome === Outcome.Neutral) {
    // keep playing!
    pg.next = simulateGame(nextGame, swapColor(player));
    if (pg.next) {
      pg.outcome = swapOutcome(pg.next.outcome);
    }
  }
  return pg;
}
