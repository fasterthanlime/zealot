import {
  ICard,
  isCivilian,
  getSquare,
  IGameState,
  Suit,
  getCardAreaType,
  swapColor,
  Color,
  IStore,
  suitName,
  forEachAreaSquare,
  AreaType,
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
import { delay } from "../reactors/game";

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

export const aiLevelFactor = 0.25;

export async function playAI(
  store: IStore,
  game: IGameState,
  player: Color,
): Promise<MCNode> {
  let root: MCNode = {
    play: null,
    player: swapColor(player),
    wins: 0,
    plays: 0,
    children: null,
  };

  let firstTries = 0;
  let weightedTries = 0;

  const scoreWeight = 2;
  const H = (game: IGameState, play: IPlayCardPayload): number => {
    if (!play) {
      return 0;
    }

    // phew, ok, there we go - let's grade this play!
    const { board } = game;
    const { col, row, player } = play;
    const card = game.decks[player][play.index];
    const bcard = getSquare(board, col, row);

    const countCards = (
      col: number,
      row: number,
      at: AreaType,
      color: Color,
    ): number => {
      let count = 0;
      forEachAreaSquare(board, col, row, at, (col, row, bcard) => {
        if (bcard && bcard.color === color) {
          count++;
        }
      });
      return count;
    };

    let score = 0;

    // playing on an empty square
    if (card.suit === Suit.Goblin) {
      let gain = 0;
      const at = getCardAreaType(bcard);
      gain += countCards(col, row, at, player);
      gain -= countCards(col, row, at, swapColor(player));

      if (gain < 2) {
        if (gain < 1) {
          // wasting a goblin isn't cool
          score -= 4;
        }
      } else {
        // kaboom
        score = (gain - 2) * 1.5;
      }
    } else if (card.suit === Suit.Priest) {
      let gain = 0;
      const at = getCardAreaType(bcard);
      gain += countCards(col, row, at, player);
      gain -= countCards(col, row, at, swapColor(player));

      if (gain < 2) {
        if (gain < 1) {
          // wasting a priest is really not cool
          score -= 6;
        }
      } else {
        // aw yeah
        score = (gain - 2) * 1.8;
      }
    } else if (card.suit === Suit.Necromancer) {
      if (bcard) {
        if (bcard.suit === Suit.Priest) {
          // stealing a priest is hella cool
          score += 10;
        } else if (bcard.suit === Suit.Goblin) {
          // well that's cool too
          score += 5;
        } else if (bcard.suit === Suit.MarksmanL) {
          // well, how much is it worth?
          let theirCardCount = countCards(
            col,
            row,
            AreaType.RayLeft,
            swapColor(player),
          );
          if (theirCardCount > 1) {
            // i'll allow it
            score += (theirCardCount - 1) * 2.1;
          }
        } else if (bcard.suit === Suit.MarksmanR) {
          // well, how much is it worth?
          let theirCardCount = countCards(
            col,
            row,
            AreaType.RayRight,
            swapColor(player),
          );
          if (theirCardCount > 1) {
            // i'll allow it
            score += (theirCardCount - 1) * 2.1;
          }
        }
      } else {
        // wasting a necromancer is extremely naughty
        score -= 10;
      }
    } else if (card.suit === Suit.MarksmanL) {
      let ourCardCount = countCards(col, row, AreaType.RayLeft, player);
      score += ourCardCount * 2;

      if (ourCardCount > 0) {
        const distanceFromBorder = play.col;
        score += distanceFromBorder * 0.2;
      }
    } else if (card.suit === Suit.MarksmanR) {
      let ourCardCount = countCards(col, row, AreaType.RayRight, player);
      score += ourCardCount * 2;

      if (ourCardCount > 0) {
        const distanceFromBorder = board.numCols - play.col;
        score += distanceFromBorder * 0.2;
      }
    } else if (card.suit === Suit.Monk) {
      let ourCardCount = countCards(col, row, AreaType.Square, player);
      score += ourCardCount * 2;
    } else if (card.suit === Suit.Peasant) {
      // getting rid of peasants is a neat idea
      score += 0.1;

      forEachAreaSquare(
        board,
        col,
        row,
        AreaType.RayLeft,
        (col, row, bcard) => {
          if (bcard && bcard.suit === Suit.MarksmanR) {
            score += 1; // ooh yeah
          }
        },
      );

      forEachAreaSquare(
        board,
        col,
        row,
        AreaType.RayRight,
        (col, row, bcard) => {
          if (bcard && bcard.suit === Suit.MarksmanL) {
            score += 1; // ooh yeah
          }
        },
      );

      const leftCard = getSquare(board, play.col - 1, play.row);
      let adjacencyCount = 0;
      if (leftCard && leftCard.color === player) {
        // ok yes that's generally good
        score += 0.25;
        adjacencyCount++;
      }
      const rightCard = getSquare(board, play.col - 1, play.row);
      if (rightCard && rightCard.color === player) {
        // ok yes that's good too
        score += 0.25;
        adjacencyCount++;
      }

      if (adjacencyCount >= 2) {
        score += 1; // even better!
      }
    }

    return score * scoreWeight;
  };

  const select = (root: MCNode): MCPath => {
    let path: MCPath = [];
    let n = root;
    let currentGame = game;

    while (true) {
      // leaf node!
      if (!n.children) {
        return path;
      }

      let untriedIndices: number[] = [];
      let bestIndex = -1;
      let bestValue = Number.MIN_SAFE_INTEGER;

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
          const h = H(currentGame, child.play) / ni;
          const value = wi / ni + c * Math.sqrt(logNi / ni) + h;
          if (value > bestValue) {
            bestIndex = index;
            bestValue = value;
          }
        }
      }

      // if any were untried, pick one at random
      if (untriedIndices.length > 0) {
        firstTries++;
        bestIndex = _.sample(untriedIndices);
      } else {
        weightedTries++;
      }

      n = n.children[bestIndex];
      currentGame = applyMove(currentGame, n.play);
      path.push(bestIndex);
    }
  };

  let deadline = store.getState().ai.level * aiLevelFactor * 1000;
  let startTime = Date.now();
  let iterations = 0;
  let sleepInterval = 0;
  while (true) {
    let sinceStart = Date.now() - startTime;
    if (sinceStart > deadline) {
      // woop, it's time
      break;
    }

    let sleepIntervalNew = Math.ceil(sinceStart / 500);
    if (sleepIntervalNew > sleepInterval) {
      // sleep for a bit, just in case the UI needs to update or something
      await delay(50);
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
        let scoredPlays = _.map(plays, p => ({ p, s: H(currentGame, p) }));
        scoredPlays = _.sortBy(scoredPlays, p => -p.s);
        const maxBestPlays = Math.max(10, Math.ceil(plays.length / 8));
        plays = _.map(_.first(scoredPlays, maxBestPlays), p => p.p);

        node.children = [];
        for (const play of plays) {
          let childNode: MCNode = {
            play,
            player: nextPlayer,
            plays: 0,
            wins: 0,
            children: null,
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

  let mostWins = 0;
  let bestNode: MCNode = null;
  for (const child of root.children) {
    if (child.wins > mostWins) {
      mostWins = child.wins;
      bestNode = child;
    }
  }

  if (!bestNode) {
    console.warn(`has no best node, had to pick at random`);
    bestNode = _.sample(root.children);
  }
  console.warn(`first tries: ${firstTries}, weighted tries: ${weightedTries}`);

  const h = H(game, bestNode.play);
  console.log(
    `best node (h=${h}) leads to ${bestNode.wins}/${bestNode.plays} wins (${
      root.plays
    } plays total, ${(
      root.wins /
      root.plays *
      100
    ).toFixed()}% wins for other player)`,
  );
  const card = game.decks[bestNode.player][bestNode.play.index];
  const bcard = getSquare(game.board, bestNode.play.col, bestNode.play.row);
  console.log(
    `it's playing a ${suitName(card.suit)} at ${bestNode.play.col},${
      bestNode.play.row
    } over a ${bcard ? suitName(bcard.suit) : "blank"}`,
  );

  store.dispatch(
    actions.updateAi({
      thinking: false,
      winChance: bestNode.wins / bestNode.plays,
      itersPerSec: `${perSec}K iterations/s`,
    }),
  );

  return bestNode;
}
