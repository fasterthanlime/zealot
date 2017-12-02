import { ISystemState } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: ISystemState = {
  booted: false,
};

export default reducer<ISystemState>(initialState, on => {
  on(actions.boot, (state, action) => {
    return {
      ...state,
      booted: true,
    };
  });
});
