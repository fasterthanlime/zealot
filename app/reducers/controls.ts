import * as actions from "../actions";
import { IControlsState, Color } from "../types/index";
import reducer from "./reducer";
import { Outcome } from "../util/rules";

const initialState: IControlsState = {
  draggable: null,
  dropSeq: -1,
  dropTarget: null,
  turnPlayer: Color.Blue,
  awaitingInput: false,
  hasActiveGame: false,
  showOutcome: true,
  outcome: Outcome.Neutral,
  lastMove: null,
};

export default reducer<IControlsState>(initialState, on => {
  on(actions.newGame, (state, action) => {
    return {
      ...initialState,
      showOutcome: false,
    };
  });
  on(actions.saveState, (state, action) => {
    return {
      ...state,
      lastMove: action.payload,
    };
  });
  on(actions.gameOver, (state, action) => {
    return {
      ...state,
      hasActiveGame: false,
      showOutcome: true,
      outcome: action.payload.outcome,
    };
  });
  on(actions.endTurn, (state, action) => {
    return {
      ...state,
      awaitingInput: false,
    };
  });
  on(actions.loadState, (state, action) => {
    return {
      ...state,
      turnPlayer: action.payload.play.player,
      hasActiveGame: true,
      showOutcome: false,
      lastMove: null,
    };
  });
  on(actions.nextTurn, (state, action) => {
    return {
      ...state,
      turnPlayer: action.payload.turnPlayer,
      awaitingInput: true,
    };
  });
  on(actions.dragStart, (state, action) => {
    return {
      ...state,
      draggable: action.payload,
      dropTarget: null,
    };
  });
  on(actions.dragClear, (state, action) => {
    return {
      ...state,
      draggable: null,
      dropTarget: null,
    };
  });
  on(actions.enterSquare, (state, action) => {
    const { dropTarget, seq } = action.payload;
    if (state.dropSeq > seq) {
      return state;
    }

    return {
      ...state,
      dropTarget,
      dropSeq: seq,
    };
  });
  on(actions.exitSquare, (state, action) => {
    return {
      ...state,
      dropTarget: null,
    };
  });
});
