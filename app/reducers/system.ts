import { ISystemState } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: ISystemState = {
  booted: false,
  clientWidth: 0,
  clientHeight: 0,
};

export default reducer<ISystemState>(initialState, on => {
  on(actions.boot, (state, action) => {
    return {
      ...state,
      booted: true,
    };
  });

  on(actions.viewportResized, (state, action) => {
    const { clientWidth, clientHeight } = action.payload;

    return {
      ...state,
      clientWidth,
      clientHeight,
    };
  });
});
