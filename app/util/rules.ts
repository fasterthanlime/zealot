import {
  ICard,
  isCivilian,
  getSquare,
  IGameState,
  Suit,
  getCardAreaType,
  forEachAreaSquare,
  swapColor,
  Color,
  IStore,
} from "../types/index";
import * as actions from "../actions";
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

// exploration parameter, typically sqrt(2)
const c = Math.sqrt(2);

export function playAI(store: IStore, game: IGameState, player: Color): MCNode {
  let root: MCNode = {
    play: null,
    player: swapColor(player),
    wins: 0,
    plays: 0,
    children: [],
  };

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
      const logNi = Math.log(Ni);

      for (let index = 0; index < n.children.length; index++) {
        let child = n.children[index];
        if (child.plays === 0) {
          // untried nodes should be done first!
          untriedIndices.push(index);
        } else {
          let wi = child.wins;
          const ni = child.plays;

          // see https://en.wikipedia.org/wiki/Monte_Carlo_tree_search#Exploration_and_exploitation
          const value = wi / ni + c * Math.sqrt(logNi / ni);
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

  let deadline = 3000;
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

  store.dispatch(
    actions.updateAi({
      thinking: false,
      winChance: bestNode.wins / bestNode.plays,
      itersPerSec: perSec,
    }),
  );

  return bestNode;
}
