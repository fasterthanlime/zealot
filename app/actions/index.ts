import {
  IAction,
  Color,
  AreaType,
  IAIState,
  ILastMove,
  ISettingsState,
} from "../types/index";
import { Outcome } from "../util/rules";

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
  GAME_OVER: null,

  DRAG_START: null,
  DRAG_END: null,
  DRAG_CLEAR: null,

  TRY_ENTER_SQUARE: null,
  ENTER_SQUARE: null,
  EXIT_SQUARE: null,

  PLAY_CARD: null,
  CARD_PLAYED: null,
  END_TURN: null,
  NEXT_TURN: null,

  LOAD_STATE: null,

  MOUSE_MOVE: null,

  INVALID_MOVE: null,
  CLEAR_EFFECTS: null,

  VIEWPORT_RESIZED: null,

  DEAL_ALL: null,

  UPDATE_AI: null,
  UPDATE_SETTINGS: null,

  REPLAY: null,
  SAVE_STATE: null,
});

export const boot = createAction<{}>(types.BOOT);

export const newGame = createAction<{}>(types.NEW_GAME);
export const replay = createAction<{}>(types.REPLAY);
export const gameOver = createAction<{
  outcome: Outcome;
}>(types.GAME_OVER);
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

export interface IPlayCardPayload {
  player: Color;
  index: number;
  col: number;
  row: number;
}
export const playCard = createAction<IPlayCardPayload>(types.PLAY_CARD);
export const cardPlayed = createAction<IPlayCardPayload>(types.CARD_PLAYED);

export const loadState = createAction<ILastMove>(types.LOAD_STATE);
export const saveState = createAction<ILastMove>(types.SAVE_STATE);

export const endTurn = createAction<{}>(types.END_TURN);
export const nextTurn = createAction<{
  turnPlayer: Color;
  canPass: boolean;
}>(types.NEXT_TURN);

export const invalidMove = createAction<{
  col: number;
  row: number;
}>(types.INVALID_MOVE);

export const clearEffects = createAction<{}>(types.CLEAR_EFFECTS);

export const viewportResized = createAction<{
  clientWidth: number;
  clientHeight: number;
}>(types.VIEWPORT_RESIZED);

export const dealAll = createAction<{}>(types.DEAL_ALL);

export const updateAi = createAction<Partial<IAIState>>(types.UPDATE_AI);
export const updateSettings = createAction<Partial<ISettingsState>>(
  types.UPDATE_SETTINGS,
);
