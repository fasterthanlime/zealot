import { IScoreState } from "../types/index";
import * as actions from "../actions";
import { Outcome } from "../util/rules";
import reducer from "./reducer";

const initialState: IScoreState = {
  wins: 0,
  draws: 0,
  losses: 0,
};

export default reducer<IScoreState>(initialState, on => {
  on(actions.gameOver, (state, action) => {
    const { outcome } = action.payload;
    switch (outcome) {
      case Outcome.Win:
        return {
          ...state,
          wins: state.wins + 1,
        };
      case Outcome.Loss:
        return {
          ...state,
          losses: state.losses + 1,
        };
      case Outcome.Draw:
        return {
          ...state,
          draws: state.draws + 1,
        };
    }

    return state;
  });

  on(actions.loadState, (state, action) => {
    return action.payload.score;
  });
});
