import * as actions from "../actions";
import { Watcher } from "./watcher";

let LS_KEY = "@zealot/settings";

export default function(watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    console.log("Booting!");
    const item = localStorage.getItem(LS_KEY);
    if (item) {
      let data: any = null;
      try {
        data = JSON.parse(item);
      } catch (e) {
        // meh
      }
      if (data) {
        console.log("Loaded settings: ", data);
        const { musicEnabled, level } = data;
        store.dispatch(
          actions.updateSettings({
            musicEnabled,
            level,
          }),
        );
      }
    }
  });

  watcher.on(actions.updateSettings, async (store, action) => {
    const { musicEnabled, level } = store.getState().settings;
    const settings = { musicEnabled, level };
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
    console.log("Saved settings: ", settings);
  });
}
