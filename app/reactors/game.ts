import { Watcher } from "./watcher";
import * as actions from "../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.dragEnd, async (store, action) => {
    const { controls } = store.getState();

    store.dispatch(actions.dragClear({}));

    const { draggable, dropTarget } = controls;
    if (draggable && dropTarget) {
      store.dispatch(
        actions.playCard({
          player: draggable.player,
          index: draggable.index,
          col: dropTarget.col,
          row: dropTarget.row,
        }),
      );
    }
  });
}
