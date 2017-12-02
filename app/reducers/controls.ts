import * as actions from "../actions";
import { IControlsState, Color, swapColor } from "../types/index";
import reducer from "./reducer";

const initialState: IControlsState = {
  draggable: null,
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
  on(actions.playCard, (state, action) => {
    return nextTurn(state);
  });
  on(actions.skipTurn, (state, action) => {
    return nextTurn(state);
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
    return {
      ...state,
      dropTarget: action.payload,
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

function nextTurn(state: IControlsState): IControlsState {
  return {
    ...state,
    turnPlayer: swapColor(state.turnPlayer),
  };
}
