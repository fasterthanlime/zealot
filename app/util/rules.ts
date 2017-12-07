import {
  ICard,
  isCivilian,
  getSquare,
  IGameState,
  Suit,
  getCardAreaType,
  swapColor,
  Color,
  forEachAreaSquare,
} from "../types/index";
import { IPlayCardPayload } from "../actions";

export function isValidMove(
  state: IGameState,
  play: IPlayCardPayload,
): boolean {
  const { board } = state;
  let card = state.decks[play.player][play.index];
  const bcard = getSquare(board, play.col, play.row);

  let valid = true;

  if (bcard) {
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
  if (play === null) {
    return state;
  }

  const { player, index, col, row } = play;
  const deck = state.decks[player];
  let card = deck[index];
  const newDeck = [...deck];
  newDeck.splice(index, 1);

  state = {
    ...state,
    decks: {
      ...state.decks,
      [player]: newDeck,
    },
  };

  let board = state.board;

  const bcard = getSquare(board, col, row);

  let trashPile = state.trashPile;
  let discard = (card: ICard) => {
    if (card) {
      trashPile = [...trashPile, card];
    }
  };

  if (card.suit === Suit.Necromancer) {
    if (bcard) {
      let convertedCard: ICard = {
        ...bcard,
        color: player,
      };
      let newCards = [...state.decks[player], convertedCard];
      state = {
        ...state,
        decks: {
          ...state.decks,
          [player]: newCards,
        },
      };
    }

    board = {
      ...board,
      cards: [...board.cards],
    };
    board.cards[row * board.numCols + col] = null;

    trashPile = [...trashPile, card];
  } else {
    discard(bcard);

    board = {
      ...board,
      cards: [...board.cards],
    };
    board.cards[row * board.numCols + col] = card;

    const areaType = getCardAreaType(bcard);
    forEachAreaSquare(board, col, row, areaType, (col, row, bcard) => {
      if (!bcard) {
        // oh, nothing to do.
        return;
      }

      switch (card.suit) {
        case Suit.Goblin:
          // destroy all the things!
          discard(bcard);
          board.cards[row * board.numCols + col] = null;
          break;
        case Suit.Priest:
          // swap all the things!
          board.cards[row * board.numCols + col] = {
            ...bcard,
            color: swapColor(bcard.color),
          };
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

export function computeScore(game: IGameState, color: Color): number {
  let score = 0;

  const { board } = game;
  for (let i = 0; i < board.cards.length; i++) {
    let card = board.cards[i];
    if (card && card.color === color) {
      score++;
    }
  }
  return score;
}

// AI stuff!

export enum Outcome {
  // from worst to best
  Loss = 0,
  Neutral = 1,
  Draw = 2,
  Win = 3,
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

export function computeOutcome(
  game: IGameState,
  player: Color,
  forceOutcome = false,
): Outcome {
  if (!forceOutcome) {
    for (const color of [Color.Red, Color.Blue]) {
      const deck = game.decks[color];
      if (deck.length > 0) {
        // cards left in play!
        return Outcome.Neutral;
      }
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

export function randomPlay(game: IGameState, player: Color): IPlayCardPayload {
  const cards = game.decks[player];
  let tries = 20;
  let play: IPlayCardPayload = null;
  while (tries-- > 0 && cards.length > 0) {
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
  return play;
}

export function legalPlays(
  game: IGameState,
  player: Color,
  includePass = true,
): IPlayCardPayload[] {
  // pass is always part of the legal plays
  let plays: IPlayCardPayload[] = [];
  const cards = game.decks[player];
  for (let index = 0; index < cards.length; index++) {
    for (let col = 0; col < game.board.numCols; col++) {
      for (let row = 0; row < game.board.numRows; row++) {
        const play = { col, row, index, player };
        if (isValidMove(game, play)) {
          plays.push(play);
        }
      }
    }
  }
  if (plays.length === 0 && includePass) {
    // null means 'pass'
    plays.push(null);
  }
  return plays;
}

export function hasLegalPlays(game: IGameState, player: Color): boolean {
  let plays = legalPlays(game, player, false);
  return plays.length > 0;
}

export function simulateGame(game: IGameState, player: Color): Outcome {
  let swap = false;
  let currentGame = game;

  while (true) {
    currentGame = applyMove(currentGame, randomPlay(currentGame, player));
    const outcome = computeOutcome(currentGame, player);
    if (outcome === Outcome.Neutral) {
      player = swapColor(player);
      swap = !swap;
      continue;
    }

    return swap ? swapOutcome(outcome) : outcome;
  }
}

export const aiLevelFactor = 0.25;
