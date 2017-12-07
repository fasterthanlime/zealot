import {
  IGameState,
  Color,
  ICard,
  IStore,
  Suit,
  swapColor,
  suitName,
  colorName,
} from "../types/index";
import * as _ from "underscore";
import * as actions from "../actions";
import { aiLevelFactor, Outcome, swapOutcome } from "./rules";
import { delay } from "../reactors/game";

// monte-carlo tree search, but with lighter data structures!

// exploration parameter, typically sqrt(2)
const c = Math.sqrt(2);

export interface LightMCNode {
  // move
  p: ILightPlay;
  // number of wins
  w: number;
  // number of plays
  n: number;
  // children
  c: LightMCNode[];
}

export type LightMCPath = LightMCNode[];

export interface ILightGameState {
  decks: {
    [color: number]: number[];
  };
  board: number[];
}

function gameToLightGame(game: IGameState): ILightGameState {
  const res: ILightGameState = {
    decks: {
      [Color.Red]: _.map(game.decks[Color.Red], cardToLightCard),
      [Color.Blue]: _.map(game.decks[Color.Blue], cardToLightCard),
    },
    board: _.map(game.board.cards, cardToLightCard),
  };
  return res;
}

// red = positive, blue = negative
function cardToLightCard(card: ICard): number {
  if (!card) {
    return 0;
  }

  if (card.color === Color.Blue) {
    return -card.suit;
  }
  return card.suit;
}

// [deckIndex, boardIndex]
type ILightPlay = number[];

export function lightHasLegalPlays(
  lg: ILightGameState,
  player: Color,
): boolean {
  let deck = lg.decks[player];
  let boardLength = lg.board.length;
  if (boardLength !== 12) {
    throw new Error(`board length should be 12, is ${boardLength}`);
  }

  for (let deckIndex = 0; deckIndex < deck.length; deckIndex++) {
    let card = deck[deckIndex];
    let absoluteCard = card > 0 ? card : -card;
    for (let boardIndex = 0; boardIndex < boardLength; boardIndex++) {
      if (
        (absoluteCard === Suit.Peasant || absoluteCard === Suit.Monk) &&
        lg.board[boardIndex] !== 0
      ) {
        // invalid move
      } else {
        // all good
        return true;
      }
    }
  }
  return false;
}

// so it can be re-used
let lightPassPlay = [];

export function lightLegalPlays(
  lg: ILightGameState,
  player: Color,
  includePass = true,
): ILightPlay[] {
  let plays: ILightPlay[] = [];
  let deck = lg.decks[player];
  let boardLength = lg.board.length;
  for (let deckIndex = 0; deckIndex < deck.length; deckIndex++) {
    let card = deck[deckIndex];
    let absoluteCard = card > 0 ? card : -card;
    for (let boardIndex = 0; boardIndex < boardLength; boardIndex++) {
      if (
        (absoluteCard === Suit.Peasant || absoluteCard === Suit.Monk) &&
        lg.board[boardIndex] !== 0
      ) {
        // invalid move
      } else {
        // all good
        plays.push([deckIndex, boardIndex]);
      }
    }
  }
  if (includePass && plays.length === 0) {
    plays.push(lightPassPlay);
  }
  return plays;
}

export function lightSimulateGame(
  lg: ILightGameState,
  player: Color,
  numCols: number,
  numRows: number,
): Outcome {
  if (lg.board.length !== 12) {
    throw new Error(`lg.board.length should be 12, is ${lg.board.length}`);
  }
  let maxBoardIndex = lg.board.length - 1;
  let swap = false;

  while (true) {
    let tries = 20;
    let play = lightPassPlay;
    let deck = lg.decks[player];
    if (deck.length > 0) {
      while (tries-- > 0) {
        let deckIndex = _.random(0, deck.length - 1);
        let boardIndex = _.random(0, maxBoardIndex);

        let card = deck[deckIndex];
        let absoluteCard = card > 0 ? card : -card;
        if (
          (absoluteCard === Suit.Peasant || absoluteCard === Suit.Monk) &&
          lg.board[boardIndex] !== 0
        ) {
          // illegal move, try again
          continue;
        }

        play = [deckIndex, boardIndex];
        break;
      }
    }

    lightApplyMove(lg, play, player, numCols, numRows);
    let outcome = lightComputeOutcome(lg, player);
    if (outcome == Outcome.Neutral) {
      player = swapColor(player);
      swap = !swap;
      continue;
    }

    return swap ? swapOutcome(outcome) : outcome;
  }
}

function lightComputeOutcome(lg: ILightGameState, player: Color): Outcome {
  if (
    lightHasLegalPlays(lg, player) ||
    lightHasLegalPlays(lg, swapColor(player))
  ) {
    // it's not over till it's over
    return Outcome.Neutral;
  }

  let boardSize = lg.board.length;
  let redCount = 0;
  let blueCount = 0;
  for (let i = 0; i < boardSize; i++) {
    let v = lg.board[i];
    if (v > 0) {
      redCount++;
    } else if (v < 0) {
      blueCount++;
    }
  }

  if (redCount < blueCount) {
    return player === Color.Red ? Outcome.Win : Outcome.Loss;
  }

  if (blueCount < redCount) {
    return player === Color.Blue ? Outcome.Win : Outcome.Loss;
  }
  return Outcome.Draw;
}

function lightApplyMove(
  lg: ILightGameState,
  play: ILightPlay,
  player: Color,
  numCols: number,
  numRows: number,
) {
  if (play.length === 0) {
    // if we're passing, don't change anything - that was easy!
    return;
  }

  let [deckIndex, boardIndex] = play;
  let deck = lg.decks[player];
  let card = deck[deckIndex];
  deck.splice(deckIndex, 1);
  let absoluteCard: Suit = card > 0 ? card : -card;

  let mul = player === Color.Red ? 1 : -1;

  let row = Math.floor(boardIndex / numCols);
  if (row < 0 || row >= 3) {
    throw new Error(`row should be in [0,2], is ` + row);
  }
  let col = boardIndex - row * numCols;
  if (col < 0 || col >= 4) {
    throw new Error(`col should be in [0,3], is ` + col);
  }

  if (boardIndex < 0 || boardIndex >= 12) {
    throw new Error(`boardIndex should be in [0,11], is` + boardIndex);
  }

  let bcard = lg.board[boardIndex];
  let absoluteBCard: Suit = bcard > 0 ? bcard : -bcard;

  let chkIndex = (i: number) => {
    if (i < 0 || i >= 12) {
      throw new Error(`index should be in [0,11], is ` + i);
    }
  };

  switch (absoluteBCard) {
    case Suit.Necromancer: {
      // necromancer is a special card! it has its own codepath
      if (bcard === 0) {
        // well, we just threw away a necromancer
      } else {
        // steaaaal it
        deck.push(absoluteBCard * mul);
        chkIndex(boardIndex);
        lg.board[boardIndex] = 0;
      }
      break;
    }
    default: {
      // first of all, we're the captain now
      chkIndex(boardIndex);
      lg.board[boardIndex] = card;

      let goblin = absoluteCard === Suit.Goblin;
      let priest = absoluteCard === Suit.Priest;
      if (goblin || priest) {
        // ooh, we have area effects, let's go
        switch (absoluteBCard) {
          case Suit.Monk: {
            let cMin = col - 1;
            if (cMin < 0) {
              cMin = 0;
            }
            let cMax = col + 1;
            if (cMax >= numCols) {
              cMax = numCols - 1;
            }
            let rMin = row - 1;
            if (rMin < 0) {
              rMin = 0;
            }
            let rMax = row + 1;
            if (rMax >= numRows) {
              rMax = numRows - 1;
            }

            for (let c = cMin; c <= cMax; c++) {
              for (let r = rMin; r <= rMax; r++) {
                if (goblin) {
                  // boom!
                  chkIndex(c + r * numCols);
                  lg.board[c + r * numCols] = 0;
                } else if (priest) {
                  // convert!
                  chkIndex(c + r * numCols);
                  lg.board[c + r * numCols] *= -1;
                }
              }
            }
            break;
          }
          case Suit.MarksmanL: {
            let cMax = col;
            let cMin = 0;
            for (let c = cMax; c >= cMin; c--) {
              if (goblin) {
                chkIndex(c + row * numCols);
                lg.board[c + row * numCols] = 0;
              } else if (priest) {
                chkIndex(c + row * numCols);
                lg.board[c + row * numCols] *= -1;
              }
            }
            break;
          }
          case Suit.MarksmanR: {
            let cMin = col;
            let cMax = numCols - 1;
            for (let c = cMin; c <= cMax; c++) {
              if (goblin) {
                chkIndex(c + row * numCols);
                lg.board[c + row * numCols] = 0;
              } else if (priest) {
                chkIndex(c + row * numCols);
                lg.board[c + row * numCols] *= -1;
              }
            }
            break;
          }
          default: {
            if (goblin) {
              chkIndex(col + row * numCols);
              lg.board[col + row * numCols] = 0;
            } else if (priest) {
              chkIndex(col + row * numCols);
              lg.board[col + row * numCols] *= -1;
            }
            break;
          }
        }
      } else {
        // muffin to do
      }
      break;
    }
  }
}

function cloneLightGame(lg: ILightGameState): ILightGameState {
  if (lg.board.length !== 12) {
    throw new Error(`unexpected length: ${lg.board.length}`);
  }
  const res: ILightGameState = {
    board: [...lg.board],
    decks: {
      [Color.Red]: [...lg.decks[Color.Red]],
      [Color.Blue]: [...lg.decks[Color.Blue]],
    },
  };
  return res;
}

interface ISelectResult {
  path: LightMCPath;
  cplayer: Color;
  clg: ILightGameState;
  node: LightMCNode;
}

export async function playAILight(
  store: IStore,
  game: IGameState,
  player: Color,
): Promise<LightMCNode> {
  console.warn(`=== Light AI start, playing ${colorName(player)}`);

  let lg = gameToLightGame(game);
  console.log(`light game: `, lg);

  if (!lightHasLegalPlays(lg, player)) {
    return <LightMCNode>{
      p: lightPassPlay,
      w: 0,
      n: 0,
      c: null,
    };
  }

  let root: LightMCNode = {
    p: lightPassPlay,
    w: 0,
    n: 0,
    c: null,
  };

  let firstTries = 0;
  let weightedTries = 0;

  const numCols = game.board.numCols;
  const numRows = game.board.numRows;

  const countCards = (
    lg: ILightGameState,
    col: number,
    row: number,
    areaSuit: Suit,
    color: Color,
  ): number => {
    let mul = color === Color.Red ? 1 : -1;

    switch (areaSuit) {
      case Suit.Monk: {
        let count = 0;
        let cMin = col - 1;
        if (cMin < 0) {
          cMin = 0;
        }
        let cMax = col + 1;
        if (cMax >= numCols) {
          cMax = numCols - 1;
        }
        let rMin = row - 1;
        if (rMin < 0) {
          rMin = 0;
        }
        let rMax = row + 1;
        if (rMax >= numRows) {
          rMax = numRows - 1;
        }

        for (let c = cMin; c <= cMax; c++) {
          for (let r = rMin; r <= rMax; r++) {
            if (lg.board[c + r * numCols] * mul > 0) {
              count++;
            }
          }
        }
        return count;
      }
      case Suit.MarksmanL: {
        let count = 0;
        let cMax = col;
        let cMin = 0;
        for (let c = cMax; c >= cMin; c--) {
          if (lg.board[c + row * numCols] * mul > 0) {
            count++;
          }
        }
        return count;
      }
      case Suit.MarksmanR: {
        let cMin = col;
        let cMax = numCols - 1;
        let count = 0;
        for (let c = cMin; c <= cMax; c++) {
          if (lg.board[c + row * numCols] * mul > 0) {
            count++;
          }
        }
        return count;
      }
      default:
        return lg.board[col + row * numCols] * mul > 0 ? 1 : 0;
    }
  };

  const scoreWeight = 2;
  const H = (lg: ILightGameState, play: ILightPlay, player: Color): number => {
    if (play.length === 0) {
      // pass play? score of 0
      return 0;
    }

    // phew, ok, there we go - let's grade this play!
    let score = 0;
    let [deckIndex, boardIndex] = play;

    let row = Math.floor(boardIndex / numCols);
    let col = boardIndex - row * numCols;

    let card = lg.decks[player][deckIndex];
    let absoluteCard = card < 0 ? -card : card;

    let bcard = lg.board[boardIndex];
    let absoluteBCard = bcard < 0 ? -bcard : bcard;
    let opponent = swapColor(player);

    switch (absoluteCard) {
      case Suit.Goblin: {
        let gain =
          countCards(lg, col, row, absoluteBCard, player) -
          countCards(lg, col, row, absoluteBCard, opponent);

        if (gain < 2) {
          if (gain < 1) {
            // wasting a goblin isn't cool
            score -= 4;
          }
        } else {
          // kaboom
          score = (gain - 2) * 1.5;
        }
        break;
      }

      case Suit.Priest: {
        let gain =
          countCards(lg, col, row, absoluteBCard, player) -
          countCards(lg, col, row, absoluteBCard, opponent);

        if (gain < 2) {
          if (gain < 1) {
            // wasting a priest is really not cool
            score -= 6;
          }
        } else {
          // aw yeah
          score = (gain - 2) * 1.8;
        }
        break;
      }

      case Suit.Necromancer: {
        switch (absoluteBCard) {
          case Suit.Priest: {
            // stealing a priest is hella cool
            score += 10;
            break;
          }
          case Suit.Goblin: {
            // well that's cool too
            score += 5;
            break;
          }
          case Suit.MarksmanL: {
            let theirCardCount = countCards(
              lg,
              col,
              row,
              Suit.MarksmanL,
              opponent,
            );
            if (theirCardCount > 1) {
              // i'll allow it
              score += (theirCardCount - 1) * 2.1;
            }
            break;
          }
          case Suit.MarksmanR: {
            // well, how much is it worth?
            let theirCardCount = countCards(
              lg,
              col,
              row,
              Suit.MarksmanR,
              opponent,
            );
            if (theirCardCount > 1) {
              // i'll allow it
              score += (theirCardCount - 1) * 2.1;
            }
            break;
          }
          default: {
            // wasting a necromancer is extremely naughty
            score -= 10;
          }
        }
        break;
      }
      case Suit.MarksmanL: {
        let ourCardCount = countCards(lg, col, row, Suit.MarksmanL, player);
        score += ourCardCount * 2;

        if (ourCardCount > 0) {
          const distanceFromBorder = col;
          score += distanceFromBorder * 0.2;
        }
        break;
      }
      case Suit.MarksmanR: {
        let ourCardCount = countCards(lg, col, row, Suit.MarksmanR, player);
        score += ourCardCount * 2;

        if (ourCardCount > 0) {
          const distanceFromBorder = numCols - col;
          score += distanceFromBorder * 0.2;
        }
        break;
      }
      case Suit.Monk: {
        let ourCardCount = countCards(lg, col, row, Suit.Monk, player);
        score += ourCardCount * 2;
        break;
      }
      case Suit.Peasant: {
        // getting rid of peasants is a neat idea
        score += 0.1;

        // placing peasants to the right of a MarksmanR is good
        for (let c = col - 1; c >= 0; c--) {
          const bc = lg.board[c + row * numCols];
          const abc = bc > 0 ? bc : -bc;
          if (abc === Suit.MarksmanR) {
            score += 1;
          }
        }
        // placing peasants to the left of a MarksmanL is good
        for (let c = col + 1; c < numCols; c++) {
          const bc = lg.board[c + row * numCols];
          const abc = bc > 0 ? bc : -bc;
          if (abc === Suit.MarksmanL) {
            score += 1;
          }
        }

        // let's try to group peasants together
        let mul = player === Color.Red ? 1 : -1;
        let adjacencyCount = 0;
        let lcol = col - 1;
        let rcol = col + 1;
        if (lcol >= 0 && lg.board[lcol + row * numCols] * mul > 0) {
          // one of our cards on the left? nice
          score += 0.25;
          adjacencyCount++;
        }
        if (rcol < numCols && lg.board[rcol + row * numCols] * mul > 0) {
          // one of our cards on the right? nice
          score += 0.25;
          adjacencyCount++;
        }

        if (adjacencyCount >= 2) {
          // cards on both sides? jackpot!
          score += 1;
        }
        break;
      }
    }

    return score * scoreWeight;
  };

  const select = (root: LightMCNode): ISelectResult => {
    const path: LightMCPath = [];
    let n = root;
    let clg = cloneLightGame(lg);
    let cplayer = swapColor(player);

    while (true) {
      if (!n.c) {
        // leaf node, we're done selecting
        return { path, clg, cplayer, node: n };
      }

      let untriedIndices: number[] = [];
      let bestIndex = -1;
      let bestValue = Number.MIN_SAFE_INTEGER;

      for (let index = 0; index < n.c.length; index++) {
        if (n.c[index].n === 0) {
          untriedIndices.push(index);
        }
      }

      let nextPlayer = swapColor(cplayer);

      if (untriedIndices.length > 0) {
        // if any are untried, try a random one
        bestIndex = _.sample(untriedIndices);
        firstTries++;
      } else {
        weightedTries++;
        // otherwise, start weighing
        let Ni = 0;
        for (const child of n.c) {
          Ni += child.n;
        }
        const logNi = Math.log(Ni);

        for (let index = 0; index < n.c.length; index++) {
          let child = n.c[index];
          let wi = child.w;
          let ni = child.n;

          // see https://en.wikipedia.org/wiki/Monte_Carlo_tree_search#Exploration_and_exploitation
          const h = H(clg, child.p, nextPlayer) / ni;
          const value = wi / ni + c * Math.sqrt(logNi / ni) + h;
          if (value > bestValue) {
            // if (ni > 100) {
            // console.log(
            //   `we've played`,
            //   child,
            //   `over a 100 times and yet ${value} > ${
            //     bestValue
            //   }. note that h = ${h}`,
            // );
            // }
            bestIndex = index;
            bestValue = value;
          }
        }
      }

      n = n.c[bestIndex];
      lightApplyMove(clg, n.p, nextPlayer, numCols, numRows);
      cplayer = nextPlayer;
      path.push(n);
    }
  };

  let deadline = store.getState().settings.level * aiLevelFactor * 1000;
  let startTime = Date.now();
  let iterations = 0;
  let sleepInterval = 1;
  while (true) {
    iterations++;
    if (iterations % 100 === 0) {
      let sinceStart = Date.now() - startTime;
      if (sinceStart > deadline) {
        // woop, it's time
        break;
      }

      let sleepIntervalNew = Math.ceil(sinceStart / 500);
      if (sleepIntervalNew > sleepInterval) {
        // sleep for a bit, just in case the UI needs to update or something
        await delay(10);
        sleepInterval++;
      }
    }

    // Phase 1: select!
    let { path, clg, cplayer, node } = select(root);

    // Phase 2: expand!
    {
      let outcome = lightComputeOutcome(clg, cplayer);
      if (outcome === Outcome.Neutral) {
        let nextPlayer = swapColor(cplayer);
        let plays = lightLegalPlays(clg, nextPlayer);
        let scoredPlays = _.map(plays, p => ({ p, s: H(clg, p, nextPlayer) }));
        const maxBestPlays = Math.max(10, Math.ceil(plays.length / 8));
        plays = _.map(_.first(scoredPlays, maxBestPlays), p => p.p);

        node.c = [];
        for (const play of plays) {
          let childNode: LightMCNode = {
            p: play,
            w: 0,
            n: 0,
            c: null,
          };
          node.c.push(childNode);
        }

        let chosenChild = _.sample<LightMCNode>(node.c);
        path.push(chosenChild);
        lightApplyMove(clg, chosenChild.p, nextPlayer, numCols, numRows);
        cplayer = nextPlayer;
        node = chosenChild;
      }
    }

    // Phase 3: simulate
    let playoutPlayer = swapColor(cplayer);
    const playoutOutcome = lightSimulateGame(
      clg,
      playoutPlayer,
      numCols,
      numRows,
    );

    // Phase 4: backpropagation!
    const win = playoutOutcome === Outcome.Win;
    const loss = playoutOutcome === Outcome.Loss;
    let countWins = win || loss;

    root.n++;
    let ccplayer = player;
    for (const node of path) {
      node.n++;
      if (countWins) {
        if (win && ccplayer == playoutPlayer) {
          node.w++;
        } else if (loss && ccplayer != playoutPlayer) {
          node.w++;
        }
      }
      ccplayer = swapColor(ccplayer);
    }
  }
  let totalTime = Date.now() - startTime;
  console.log(`${iterations} literations`);

  const perSec = (iterations / 1000 / (totalTime / 1000)).toFixed(1);
  console.log(`${perSec}K literations/s (${iterations} literations total)`);

  let mostWins = 0;
  let bestNode: LightMCNode = null;
  for (const child of root.c) {
    if (child.w > mostWins) {
      mostWins = child.w;
      bestNode = child;
    }
  }
  if (!bestNode) {
    console.log(`has no best node, had to pick at random`);
    bestNode = _.sample(root.c);
  }

  console.log(`first tries: ${firstTries}, weighted tries: ${weightedTries}`);

  const h = H(lg, bestNode.p, player);
  console.log(
    `best node (h=${h}) leads to ${bestNode.w}/${bestNode.n} wins (${
      root.n
    } plays total)`,
  );

  if (bestNode.p.length > 0) {
    let play = bestNode.p;
    let [deckIndex, boardIndex] = play;
    const card = lg.decks[player][deckIndex];
    const absoluteCard = card > 0 ? card : -card;
    const bcard = lg.board[boardIndex];
    const absoluteBCard = bcard > 0 ? bcard : -bcard;

    let row = Math.floor(boardIndex / numCols);
    let col = boardIndex - row * numCols;

    console.log(
      `it's playing a ${suitName(absoluteCard)} at ${col},${row} over a ${
        absoluteBCard === 0 ? "blank" : suitName(absoluteBCard)
      }`,
    );
  } else {
    console.log(`it's passing`);
  }

  store.dispatch(
    actions.updateAi({
      lightItersPerSec: `${perSec}K literations/s`,
    }),
  );
  console.log(`tree: `, root);

  return bestNode;
}
