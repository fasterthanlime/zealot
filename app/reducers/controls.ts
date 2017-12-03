import * as actions from "../actions";
import { IControlsState, Color } from "../types/index";
import reducer from "./reducer";

const initialState: IControlsState = {
  draggable: null,
  dropSeq: -1,
  dropTarget: null,
  mouse: {
    x: 0,
    y: 0,
  },
  turnPlayer: Color.Red,
};

export default reducer<IControlsState>(initialState, on => {
  on(actions.newGame, (state, action) => {
    return initialState;
  });
  on(actions.endTurn, (state, action) => {
    return {
      ...state,
      turnPlayer: Color.Neutral,
    };
  });
  on(actions.nextTurn, (state, action) => {
    return {
      ...state,
      turnPlayer: action.payload.turnPlayer,
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
      console.log(`dropping `, action.payload);
      return state;
    }

    return {
      ...state,
      dropTarget,
      droPSeq: seq,
    };
  });
  on(actions.exitSquare, (state, action) => {
    return {
      ...state,
      dropTarget: null,
    };
  });
  on(actions.mouseMove, (state, action) => {
    return {
      ...state,
      mouse: action.payload,
    };
  });
});
