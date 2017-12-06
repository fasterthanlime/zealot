import { IAIState } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: IAIState = {
  thinking: false,
  winChance: 0,
  itersPerSec: "",
  level: 4,
  optionsOpen: true,
  musicEnabled: true,
};

export default reducer<IAIState>(initialState, on => {
  on(actions.updateAi, (state, action) => {
    return {
      ...state,
      ...action.payload,
    };
  });
});
