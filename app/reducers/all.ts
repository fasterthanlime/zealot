import { IRootState } from "../types/index";
import { combineReducers } from "redux";

import controls from "./controls";
import system from "./system";
import game from "./game";
import { reducer as notifications } from "react-notification-system-redux";

export default combineReducers<IRootState>({
  controls,
  system,
  game,
  notifications,
});
