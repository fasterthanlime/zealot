import { IAction, Color, AreaType } from "../types/index";

export function createAction<PayloadType>(type: string) {
  if (typeof type !== "string" || type.length === 0) {
    throw new Error(`Invalid action type for creator: ${type}`);
  }

  return (payload: PayloadType): IAction<PayloadType> => {
    return {
      type,
      payload,
    };
  };
}

interface IMirrorInput {
  [key: string]: null;
}

type IMirrorOutput<T> = { [key in keyof T]: string };

function mirror<T extends IMirrorInput>(input: T): IMirrorOutput<T> {
  const res: IMirrorOutput<T> = {} as any;
  for (const k of Object.keys(input)) {
    res[k] = k;
  }
  return res;
}

export const types = mirror({
  BOOT: null,

  NEW_GAME: null,

  DRAG_START: null,
  DRAG_END: null,
  DRAG_CLEAR: null,

  TRY_ENTER_SQUARE: null,
  ENTER_SQUARE: null,
  EXIT_SQUARE: null,

  PLAY_CARD: null,
  END_TURN: null,
  NEXT_TURN: null,
  PASS: null,

  MOUSE_MOVE: null,

  INVALID_MOVE: null,
  CLEAR_EFFECTS: null,

  VIEWPORT_RESIZED: null,
});

export const boot = createAction<{}>(types.BOOT);

export const newGame = createAction<{}>(types.NEW_GAME);
export const dragStart = createAction<{
  player: Color;
  index: number;
}>(types.DRAG_START);
export const dragEnd = createAction<{}>(types.DRAG_END);
export const dragClear = createAction<{}>(types.DRAG_CLEAR);

interface IEnterSquarePayload {
  col: number;
  row: number;
}

let enterSquareSeqSeed = 0;
export const _tryEnterSquare = createAction<
  {
    seq: number;
  } & IEnterSquarePayload
>(types.TRY_ENTER_SQUARE);

export const tryEnterSquare = (pl: IEnterSquarePayload) =>
  _tryEnterSquare({ ...pl, seq: enterSquareSeqSeed++ });

export const enterSquare = createAction<{
  seq: number;
  dropTarget: {
    col: number;
    row: number;
    valid: boolean;
    areaType: AreaType;
  };
}>(types.ENTER_SQUARE);

export const exitSquare = createAction<{}>(types.EXIT_SQUARE);

interface IPlayCardPayload {
  player: Color;
  index: number;
  col: number;
  row: number;
}
export const playCard = createAction<IPlayCardPayload>(types.PLAY_CARD);

export const endTurn = createAction<{}>(types.END_TURN);
export const nextTurn = createAction<{
  turnPlayer: Color;
}>(types.NEXT_TURN);

export const pass = createAction<{}>(types.PASS);

// TODO: make that a local listener instead, just don't change
// the state every time
export const mouseMove = createAction<{
  x: number;
  y: number;
}>(types.MOUSE_MOVE);

export const invalidMove = createAction<{
  col: number;
  row: number;
}>(types.INVALID_MOVE);

export const clearEffects = createAction<{}>(types.CLEAR_EFFECTS);

export const viewportResized = createAction<{
  clientWidth: number;
  clientHeight: number;
}>(types.VIEWPORT_RESIZED);
