import { IAIState } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: IAIState = {
  thinking: false,
  winChance: 0,
  itersPerSec: "",
  wins: 0,
  losses: 0,
  draws: 0,
  level: 1,
  optionsOpen: true,
};

export default reducer<IAIState>(initialState, on => {
  on(actions.updateAi, (state, action) => {
    return {
      ...state,
      ...action.payload,
    };
  });
});
