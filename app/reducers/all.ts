import { IRootState } from "../types/index";
import { combineReducers } from "redux";

import controls from "./controls";
import system from "./system";
import game from "./game";

export default combineReducers<IRootState>({
  controls,
  system,
  game,
});
