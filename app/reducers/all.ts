import { IRootState } from "../types/index";
import { combineReducers } from "redux";

import system from "./system";

export default combineReducers<IRootState>({
  system,
});
