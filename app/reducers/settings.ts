import { ISettingsState } from "../types/index";
import reducer from "./reducer";
import * as actions from "../actions";

const initialState: ISettingsState = {
  level: 4,
  musicEnabled: true,
};

export default reducer<ISettingsState>(initialState, on => {
  on(actions.updateSettings, (state, action) => {
    return {
      ...state,
      ...action.payload,
    };
  });
});
