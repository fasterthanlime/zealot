import { Store, Action } from "redux";
import { Watcher } from "../reactors/watcher";

const cardPngs = require(`../images/cards/*.png`);

export interface IStore extends Store<IRootState> {
  watcher: Watcher;
}

export interface IAction<T> extends Action {
  type: string;
  payload: T;
}

export interface IDispatch {
  (action: IAction<any>): void;
}

export function dispatcher<T, U>(
  dispatch: IDispatch,
  actionCreator: (payload: T) => IAction<U>,
) {
  return (payload: T) => {
    const action = actionCreator(payload);
    dispatch(action);
    return action;
  };
}

export interface IRootState {
  system: ISystemState;
  game: IGameState;
  ai: IAIState;
  controls: IControlsState;
  metrics: IMetricsState;
  notifications: any;
}

export interface ISystemState {
  booted: boolean;
  clientWidth: number;
  clientHeight: number;
}

export interface IMetricsState {
  playAreaOffset: IOffset;
  playAreaIncrement: IOffset;
  dealPileOffset: IOffset;
  trashPileOffset: IOffset;
  decks: {
    [color: number]: IDeckMetrics;
  };
}

export interface IDeckMetrics {
  offset: IOffset;
  height: number;
  increment: IOffset;
}

export interface IOffset {
  x: number;
  y: number;
}

export interface IGameState {
  board: IBoard;
  dealPile: IDeal[];
  trashPile: IDeal[];
  decks: IDecks;
  counts: {
    [color: number]: number;
  };
}

export interface IAIState {
  thinking: boolean;
  winChance: number;
}

export interface IDeal {
  color: Color;
  card: ICard;
}

export interface IDecks {
  [color: number]: IDeck;
}

export interface IControlsState {
  draggable?: IDraggable;
  dropSeq: number;
  dropTarget?: {
    col: number;
    row: number;
    valid: boolean;
    areaType: AreaType;
  };
  turnPlayer: Color;
  awaitingInput: boolean;
}

export interface IDraggable {
  player: Color;
  index: number;
}

export interface IDeck {
  cards: ICard[];
}

export interface ICard {
  id: string;
  suit: Suit;
}

export interface IBoard {
  numCols: number;
  numRows: number;
  squares: ISquare[];
}

export function getSquare(board: IBoard, col: number, row: number): ISquare {
  if (col < 0 || col >= board.numCols) {
    return null;
  }
  if (row < 0 || row >= board.numRows) {
    return null;
  }
  const index = row * board.numCols + col;
  return board.squares[index];
}

export function withChangedSquare(
  board: IBoard,
  col: number,
  row: number,
  square: ISquare,
): IBoard {
  return setSquare(board, col, row, oldsquare => square);
}

export function setSquare(
  board: IBoard,
  col: number,
  row: number,
  cb: (square: ISquare) => ISquare,
): IBoard {
  if (col < 0 || col >= board.numCols) {
    return board;
  }
  if (row < 0 || row >= board.numRows) {
    return board;
  }
  const index = row * board.numCols + col;
  const copy = {
    ...board,
    squares: [...board.squares],
  };
  copy.squares[index] = cb(copy.squares[index]);

  return copy;
}

export interface ISquare {
  color: Color;
  card: ICard;
}

export enum Color {
  Neutral = 0,
  Red = 1,
  Blue = 2,
}

export enum Suit {
  None = 0,

  Peasant = 1,

  Martyr = 2,
  Monk = 3,
  MarksmanL = 4,
  MarksmanR = 5,

  Priest = 6,
  Goblin = 7,
  Necromancer = 8,
}

export function suitName(suit: Suit): string {
  switch (suit) {
    case Suit.Peasant:
      return "Peasant";
    case Suit.Martyr:
      return "Martyr";
    case Suit.Monk:
      return "Monk";
    case Suit.MarksmanL:
    case Suit.MarksmanR:
      return "Marksman";
    case Suit.Priest:
      return "Priest";
    case Suit.Goblin:
      return "Goblin";
    case Suit.Necromancer:
      return "Necromancer";
    default:
      return "<Unknown suit>";
  }
}

export function colorName(color: Color): string {
  switch (color) {
    case Color.Red:
      return "Red";
    case Color.Blue:
      return "Blue";
  }
  return "Neutral";
}

console.log(`cardPngs = `, cardPngs);

export const cardGraphics = {
  [Color.Red]: {
    [Suit.Peasant]: require("../images/cards/Rpeasant.png").default,
    [Suit.Martyr]: require("../images/cards/Rmartyr.png").default,
    [Suit.Monk]: require("../images/cards/Rmonk.png").default,
    [Suit.MarksmanL]: require("../images/cards/Rmarksmanl.png").default,
    [Suit.MarksmanR]: require("../images/cards/Rmarksmanr.png").default,
    [Suit.Priest]: require("../images/cards/Rpriest.png").default,
    [Suit.Goblin]: require("../images/cards/Rgoblin.png").default,
    [Suit.Necromancer]: require("../images/cards/Rnecromancer.png").default,
  },
  [Color.Blue]: {
    [Suit.Peasant]: require("../images/cards/Bpeasant.png").default,
    [Suit.Martyr]: require("../images/cards/Bmartyr.png").default,
    [Suit.Monk]: require("../images/cards/Bmonk.png").default,
    [Suit.MarksmanL]: require("../images/cards/Bmarksmanl.png").default,
    [Suit.MarksmanR]: require("../images/cards/Bmarksmanr.png").default,
    [Suit.Priest]: require("../images/cards/Bpriest.png").default,
    [Suit.Goblin]: require("../images/cards/Bgoblin.png").default,
    [Suit.Necromancer]: require("../images/cards/Bnecromancer.png").default,
  },
};

export const cardCounts = {
  [Suit.Peasant]: 12,

  // This card is kinda useless :o
  // [Suit.Martyr]: 3,

  [Suit.Monk]: 2,
  [Suit.MarksmanL]: 2,
  [Suit.MarksmanR]: 2,

  [Suit.Priest]: 3,
  [Suit.Goblin]: 2,
  [Suit.Necromancer]: 2,
};

export enum AreaType {
  Single = 1,
  Plus = 2,
  Square = 3,
  RayRight = 4,
  RayLeft = 5,
}

export function getCardAreaType(card: ICard): AreaType {
  if (!card) {
    return AreaType.Single;
  }
  const { suit } = card;

  switch (suit) {
    case Suit.Monk:
      return AreaType.Square;
    case Suit.Martyr:
      return AreaType.Plus;
    case Suit.MarksmanL:
      return AreaType.RayLeft;
    case Suit.MarksmanR:
      return AreaType.RayRight;
    default:
      return AreaType.Single;
  }
}

export function forEachAreaSquare(
  board: IBoard,
  col: number,
  row: number,
  at: AreaType,
  cb: (col: number, row: number, square: ISquare) => void,
) {
  const originalCol = col;
  const originalRow = row;

  const tryCell = function(col: number, row: number) {
    const sq = getSquare(board, col, row);
    if (sq) {
      // if we got a square, we're in the board!
      // if we're in the board, cb will want to know about it!
      cb(col, row, sq);
    }
  };

  if (at === AreaType.Single) {
    // muffin
  } else if (at === AreaType.Plus) {
    tryCell(col - 1, row);
    tryCell(col + 1, row);
    tryCell(col, row - 1);
    tryCell(col, row + 1);
  } else if (at === AreaType.Square) {
    tryCell(col - 1, row - 1);
    tryCell(col - 1, row);

    tryCell(col - 1, row + 1);
    tryCell(col, row + 1);

    tryCell(col + 1, row + 1);
    tryCell(col + 1, row);

    tryCell(col + 1, row - 1);
    tryCell(col, row - 1);
  } else if (at === AreaType.RayLeft) {
    col--;
    while (col >= 0) {
      tryCell(col, row);
      col--;
    }
  } else if (at === AreaType.RayRight) {
    col++;
    while (col < board.numCols) {
      tryCell(col, row);
      col++;
    }
  }

  tryCell(originalCol, originalRow);
}

export function swapColor(color: Color): Color {
  if (color === Color.Red) {
    return Color.Blue;
  }
  if (color === Color.Blue) {
    return Color.Red;
  }
  return color; // /shrug
}

export function makeNeutralSquare(): ISquare {
  return {
    color: Color.Neutral,
    card: null,
  };
}

export function isCivilian(suit: Suit): boolean {
  switch (suit) {
    case Suit.Peasant:
    case Suit.Martyr:
    case Suit.Monk:
      return true;
    default:
      return false;
  }
}

export function tipForCard(card: ICard): string {
  if (!card) {
    return null;
  }

  switch (card.suit) {
    case Suit.Peasant:
      return "[Peasant] Must be placed on empty space.";

    case Suit.Monk:
      return "[Monk] 3x3 square AOE. Must be placed on empty space.";

    case Suit.MarksmanL:
      return "[Marksman] Area effect: all cards to the left.";

    case Suit.MarksmanR:
      return "[Marksman] Area effect: all cards to the right.";

    case Suit.Priest:
      return "[Priest] Inverts card colors.";

    case Suit.Goblin:
      return "[Goblin] Blows up cards.";

    case Suit.Necromancer:
      return "[Necromancer] Steal a card.";

    default:
      return `${suitName(card.suit)}: TODO`;
  }
}

export function getDraggedCard(rs: IRootState): ICard {
  const { controls, game } = rs;
  if (!controls.draggable) {
    return null;
  }

  const { player, index } = controls.draggable;
  const deck = game.decks[player];
  return deck.cards[index];
}
