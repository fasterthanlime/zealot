import { IAIState, Color } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: IAIState = {
  thinking: false,
  winChance: 0,
  lightWinChance: 0,
  itersPerSec: "",
  lightItersPerSec: "",
  optionsOpen: true,
  firstTurn: Color.Red,
};

export default reducer<IAIState>(initialState, on => {
  on(actions.updateAi, (state, action) => {
    return {
      ...state,
      ...action.payload,
    };
  });
});
