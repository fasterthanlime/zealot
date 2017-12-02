import * as actions from "../actions";
import { Watcher } from "./watcher";

export default function(watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    console.log("Booting!");
  });
}
