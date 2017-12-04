import {
  ICard,
  isCivilian,
  getSquare,
  IGameState,
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
  let card = state.decks[play.player][play.index];
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
      let newCards = [...state.decks[player], previousSquare.card];
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
      squares: [...board.squares],
    };
    board.squares[row * board.numCols + col] = makeNeutralSquare();

    trashPile = [...trashPile, { color: player, card }];
  } else {
    discard(previousSquare);

    board = {
      ...board,
      squares: [...board.squares],
    };
    board.squares[row * board.numCols + col] = { card, color: player };

    const areaType = getCardAreaType(previousSquare.card);
    forEachAreaSquare(board, col, row, areaType, (col, row, square) => {
      switch (card.suit) {
        case Suit.Goblin:
          // destroy all the things!
          board.squares[row * board.numCols + col] = makeNeutralSquare();
          break;
        case Suit.Priest:
          // swap all the things!
          board.squares[row * board.numCols + col] = {
            card: square.card,
            color: swapColor(square.color),
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
    const card = decks[player][index];
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
import * as _ from "underscore";

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
    const deck = game.decks[color];
    if (deck.length > 0) {
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
  if (plays.length === 0) {
    // then we can pass
    plays.push(null);
  }
  return plays;
}

export function simulateGame(game: IGameState, player: Color): Outcome {
  const nextGame = applyMove(game, randomPlay(game, player));
  const outcome = computeOutcome(nextGame, player);
  if (outcome === Outcome.Neutral) {
    return swapOutcome(simulateGame(nextGame, swapColor(player)));
  } else {
    return outcome;
  }
}

// monte-carlo tree search, woo!

export interface MCNode {
  // root play is ignored!
  play: IPlayCardPayload;
  player: Color;
  wins: number;
  plays: number;

  children: MCNode[];
}
export type MCPath = number[];

export function bestPlay(root: MCNode) {}

export function playAI(game: IGameState, player: Color): MCNode {
  let root: MCNode = {
    play: null,
    player: swapColor(player),
    wins: 0,
    plays: 0,
    children: [],
  };

  // exploration parameter, typically sqrt(2)
  const c = Math.sqrt(2);

  const select = (root: MCNode): MCPath => {
    let path: MCPath = [];
    let n = root;

    while (true) {
      // leaf node!
      if (n.children.length === 0) {
        return path;
      }

      let untriedIndices: number[] = [];
      let bestIndex = -1;
      let bestValue = -1;

      let Ni = 0;
      for (const child of n.children) {
        Ni += child.plays;
      }

      for (let index = 0; index < n.children.length; index++) {
        let child = n.children[index];
        if (child.plays === 0) {
          // untried nodes should be done first!
          untriedIndices.push(index);
        } else {
          let wi = child.wins;
          const ni = child.plays;

          // see https://en.wikipedia.org/wiki/Monte_Carlo_tree_search#Exploration_and_exploitation
          const value = wi / ni + c * Math.sqrt(Math.log(Ni) / ni);
          if (value > bestValue) {
            bestIndex = index;
            bestValue = value;
          }
        }
      }

      // if any were untried, pick one at random
      if (untriedIndices.length > 0) {
        bestIndex = _.sample(untriedIndices);
      }

      n = n.children[bestIndex];
      path.push(bestIndex);
    }
  };

  let deadline = 1500;
  let startTime = Date.now();
  let iterations = 0;
  while (true) {
    if (Date.now() - startTime > deadline) {
      // woop, it's time
      break;
    }
    iterations++;

    // Phase 1: select!
    let path = select(root);
    let node = root;
    let backpath: MCNode[] = [root];

    let currentGame = game;
    for (const childIndex of path) {
      let child = node.children[childIndex];
      currentGame = applyMove(currentGame, child.play);
      node = child;
      backpath = [node, ...backpath];
    }

    // Phase 2: expand!
    {
      let outcome = computeOutcome(currentGame, node.player);
      if (outcome === Outcome.Neutral) {
        let nextPlayer = swapColor(node.player);
        let plays = legalPlays(currentGame, nextPlayer);
        for (const play of plays) {
          let childNode: MCNode = {
            play,
            player: nextPlayer,
            plays: 0,
            wins: 0,
            children: [],
          };
          node.children.push(childNode);
        }
        let chosenChildIndex = _.random(0, node.children.length - 1);
        path.push(chosenChildIndex);
        let child = node.children[chosenChildIndex];
        currentGame = applyMove(currentGame, child.play);
        node = child;
        backpath = [node, ...backpath];
      }
    }

    // Phase 3: simulate (after 'node', starting with the other player)
    let playoutPlayer = swapColor(node.player);
    const playoutOutcome = simulateGame(currentGame, playoutPlayer);

    // Phase 4: backpropagation!
    const win = playoutOutcome === Outcome.Win;
    const loss = playoutOutcome === Outcome.Loss;
    let countWins = win || loss;

    for (const node of backpath) {
      node.plays++;
      if (countWins) {
        if (win && node.player === playoutPlayer) {
          node.wins++;
        }
        if (loss && node.player !== playoutPlayer) {
          node.wins++;
        }
      }
    }
  }
  let totalTime = Date.now() - startTime;

  const perSec = (iterations / 1000 / (totalTime / 1000)).toFixed(1);
  console.log(`${perSec}K iterations/s (${iterations} iterations total)`);

  let bestWins = 0;
  let bestNode: MCNode = null;
  for (const child of root.children) {
    if (child.wins > bestWins) {
      bestWins = child.wins;
      bestNode = child;
    }
  }

  if (!bestNode) {
    console.warn(`has no best node, had to pick at random`);
    bestNode = _.sample(root.children);
  }

  console.log(
    `best node leads to ${bestNode.wins}/${bestNode.plays} wins (${
      root.plays
    } plays total, ${(
      root.wins /
      root.plays *
      100
    ).toFixed()}% wins for other player)`,
  );
  return bestNode;
}
