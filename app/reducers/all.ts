import { IRootState } from "../types/index";
import { combineReducers } from "redux";

import controls from "./controls";
import system from "./system";
import game from "./game";
import { reducer as notifications } from "react-notification-system-redux";
import { getMetrics } from "./get-metrics";
import derivedReducer from "./derived-reducer";

const initialReducer = combineReducers<IRootState>({
  controls,
  system,
  game,
  notifications,
  metrics: (state = {}) => state,
});

export default derivedReducer(initialReducer, state => {
  const metrics = getMetrics(state);
  return {
    ...state,
    metrics,
  };
});
