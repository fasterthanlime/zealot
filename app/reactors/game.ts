import { Watcher } from "./watcher";
import * as actions from "../actions";
import { isCivilian, getSquare, suitName } from "../types/index";

import { warning } from "react-notification-system-redux";

export default function(watcher: Watcher) {
  watcher.on(actions.dragEnd, async (store, action) => {
    const { controls, game } = store.getState();

    store.dispatch(actions.dragClear({}));

    const { draggable, dropTarget } = controls;
    if (draggable && dropTarget) {
      const card = game.decks[draggable.player].cards[draggable.index];
      if (isCivilian(card.suit)) {
        const dropSquare = getSquare(
          game.board,
          dropTarget.col,
          dropTarget.row,
        );
        if (dropSquare && dropSquare.card) {
          store.dispatch(
            warning({
              title: "Invalid move",
              message: `Can only place ${suitName(
                card.suit,
              )} (a civilian) on empty squares!`,
            }),
          );
          return;
        }
      }

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
