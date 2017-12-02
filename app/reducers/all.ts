import { IRootState } from "../types/index";
import { combineReducers } from "redux";

import system from "./system";
import game from "./game";

export default combineReducers<IRootState>({
  system,
  game,
});
