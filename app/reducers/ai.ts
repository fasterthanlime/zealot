import { IAIState } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: IAIState = {
  winChance: 0,
};

export default reducer<IAIState>(initialState, on => {
  on(actions.updateAi, (state, action) => {
    return {
      ...state,
      ...action.payload,
    };
  });
});
