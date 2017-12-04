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
  if (play === null) {
    return state;
  }

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

export function randomPlay(game: IGameState, player: Color): IPlayCardPayload {
  const cards = game.decks[player].cards;
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
  const cards = game.decks[player].cards;
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
  wins: number;
  plays: number;

  children: MCNode[];
}
export type MCPath = number[];

export function bestPlay(root: MCNode) {}

export function playAI(game: IGameState, player: Color): MCNode {
  let root: MCNode = {
    play: null,
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

    let currentGame = game;
    for (const childIndex of path) {
      let child = node.children[childIndex];
      currentGame = applyMove(currentGame, child.play);
      node = child;
    }

    // Phase 2: expand!
    {
      const oddPathSize = path.length % 2 === 1;
      const nodePlayer = oddPathSize ? swapColor(player) : player;

      let outcome = computeOutcome(currentGame, nodePlayer);
      if (outcome === Outcome.Neutral) {
        let plays = legalPlays(currentGame, nodePlayer);
        for (const play of plays) {
          let childNode: MCNode = {
            play,
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
      }
    }

    // Phase 3: simulate!
    let nodePlayer: Color;
    {
      const oddPathSize = path.length % 2 === 1;
      nodePlayer = oddPathSize ? swapColor(player) : player;
    }
    const playout = simulateGame(game, nodePlayer);

    // Phase 4: backpropagation!
    let countWins = playout === Outcome.Win || playout === Outcome.Loss;
    let winnerRemain = 0;
    if (player !== nodePlayer) {
      winnerRemain = 1 - winnerRemain;
    }
    if (playout === Outcome.Loss) {
      winnerRemain = 1 - winnerRemain;
    }

    let propNode = root;
    root.plays++;

    for (let i = 0; i < path.length; i++) {
      let distanceFromRoot = i + 1;
      propNode = propNode.children[path[i]];
      propNode.plays++;
      if (countWins) {
        if (distanceFromRoot % 2 === winnerRemain) {
          propNode.wins++;
        }
      }
    }
  }

  console.log(`tree (${iterations} iterations):`, root);

  let bestWins = Number.MAX_SAFE_INTEGER;
  let bestNode: MCNode = null;
  for (const child of root.children) {
    if (child.wins < bestWins) {
      console.log(`${child.wins} < ${bestWins}, play wins:`, child.play);
      bestWins = child.wins;
      bestNode = child;
    }
  }

  if (!bestNode) {
    console.warn(`has no best node, had to pick at random`);
    bestNode = _.sample(root.children);
  }

  console.log(
    `best node leads to ${bestNode.wins}/${
      bestNode.plays
    } wins for other player (${root.plays} plays total)`,
  );
  return bestNode;
}
