import { Store, Action } from "redux";
import { Watcher } from "../reactors/watcher";

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
  controls: IControlsState;
}

export interface ISystemState {
  booted: boolean;
}

export interface IGameState {
  board: IBoard;
  decks: IDecks;
  counts: {
    [color: number]: number;
  };
}

export interface IDecks {
  [color: number]: IDeck;
}

export interface IControlsState {
  draggable?: {
    player: Color;
    index: number;
  };
  dropTarget?: {
    col: number;
    row: number;
  };
  mouse: {
    x: number;
    y: number;
  };
}

export interface IDeck {
  cards: Card[];
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
  copy.squares[index] = square;

  return copy;
}

export interface ISquare {
  color: Color;
  card: Card;
}

export enum Color {
  Neutral = 0,
  Red = 1,
  Blue = 2,
}

export enum Card {
  None = 0,

  Peasant = 1,

  Martyr = 2,
  Monk = 3,
  MarksmanL = 4,
  MarksmanR = 5,

  Priest = 6,
  Goblin = 7,
  Necromancer = 8,

  MAX_CARD = 8,
}

export const cardGraphics = {
  [Card.Peasant]: require("../images/cards/peasant.png").default,

  [Card.Martyr]: require("../images/cards/martyr.png").default,
  [Card.Monk]: require("../images/cards/monk.png").default,
  [Card.MarksmanL]: require("../images/cards/marksmanl.png").default,
  [Card.MarksmanR]: require("../images/cards/marksmanr.png").default,

  [Card.Priest]: require("../images/cards/priest.png").default,
  [Card.Goblin]: require("../images/cards/goblin.png").default,
  [Card.Necromancer]: require("../images/cards/necromancer.png").default,
};

export const cardCounts = {
  [Card.Peasant]: 10,

  [Card.Martyr]: 3,
  [Card.Monk]: 3,
  [Card.MarksmanL]: 2,
  [Card.MarksmanR]: 2,

  [Card.Priest]: 4,
  [Card.Goblin]: 2,
  [Card.Necromancer]: 4,
};

export const playerColors = {
  [Color.Red]: "#930132",
  [Color.Blue]: "#225e93",
  default: "black",
};

export const deckSize = 12;
