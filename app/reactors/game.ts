import { Watcher } from "./watcher";
import * as actions from "../actions";
import {
  isCivilian,
  getSquare,
  suitName,
  swapColor,
  IStore,
  Color,
  IRootState,
  AreaType,
  getDraggedCard,
  getCardAreaType,
  colorName,
} from "../types/index";

import { warning, info } from "react-notification-system-redux";
import { playCardFlick, playCardPlace, playSound } from "../util/sounds";
import { playAI } from "../util/rules";

const dealWait = 0;
const animDuration = 600;

const aiColor = Color.Red;

const iconPath = require("../images/favicon.png").default;

(function() {
  var link = (document.querySelector("link[rel*='icon']") ||
    document.createElement("link")) as any;
  link.type = "image/png";
  link.rel = "shortcut icon";
  link.href = iconPath;
  document.getElementsByTagName("head")[0].appendChild(link);
})();

const Favico = require("favico.js");
const favicon = new Favico({
  animation: "slide",
});

export default function(watcher: Watcher) {
  watcher.on(actions.nextTurn, async (store, action) => {
    if (action.payload.turnPlayer === aiColor) {
      store.dispatch(actions.updateAi({ thinking: true }));
      await delay(20);

      const rs = store.getState();
      let { game } = rs;

      const node = await playAI(store, game, aiColor);
      store.dispatch(actions.playCard(node.play));
      favicon.badge(1);
    }
  });

  watcher.on(actions.playCard, async (store, action) => {
    const rs = store.getState();

    store.dispatch(actions.endTurn({}));

    if (action.payload) {
      playCardPlace();
      store.dispatch(actions.cardPlayed(action.payload));
    }

    await doNextTurn(store, rs.controls.turnPlayer, true);
  });

  watcher.on(actions.newGame, async (store, action) => {
    while (true) {
      const { dealPile } = store.getState().game;
      if (dealPile.length === 0) {
        store.dispatch(actions.doneDealing({}));
        store.dispatch(actions.nextTurn({ turnPlayer: Color.Blue }));
        return;
      }

      await delay(dealWait);
      store.dispatch(actions.dealNext({}));
    }
  });

  watcher.on(actions.dragStart, async (store, action) => {
    playCardFlick();
  });

  watcher.on(actions._tryEnterSquare, async (store, action) => {
    const rs = store.getState();
    const draggedCard = getDraggedCard(rs);
    if (!draggedCard) {
      // why bother?
      return;
    }

    const { board } = rs.game;
    const { col, row } = action.payload;
    const bcard = getSquare(board, col, row);

    let valid = true;
    let areaType = AreaType.Single;

    if (bcard) {
      if (isCivilian(draggedCard.suit)) {
        // civilians can only go on empty squares
        valid = false;
      } else {
        areaType = getCardAreaType(bcard);
      }
    }

    store.dispatch(
      actions.enterSquare({
        seq: action.payload.seq,
        dropTarget: {
          col,
          row,
          valid,
          areaType,
        },
      }),
    );
  });

  watcher.on(actions.dragEnd, async (store, action) => {
    favicon.reset();

    const { controls, game } = store.getState();
    store.dispatch(actions.dragClear({}));

    const { draggable, dropTarget } = controls;
    if (draggable && dropTarget) {
      const card = game.decks[draggable.player][draggable.index];
      if (isCivilian(card.suit)) {
        const bcard = getSquare(game.board, dropTarget.col, dropTarget.row);
        if (bcard) {
          store.dispatch(
            actions.invalidMove({ col: dropTarget.col, row: dropTarget.row }),
          );
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

export async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function doNextTurn(
  store: IStore,
  previousPlayer: Color,
  swapPlayers: boolean,
) {
  const rs = store.getState();
  if (hasEmptyDeck(rs, Color.Red) && hasEmptyDeck(rs, Color.Blue)) {
    const r = rs.game.counts[Color.Red];
    const b = rs.game.counts[Color.Blue];
    let message = `It's a draw!`;

    if (r < b) {
      store.dispatch(
        actions.updateAi({
          wins: rs.ai.wins + 1,
        }),
      );
      message = `AI won!`;
      playSound("lose", 1);
    } else if (b < r) {
      store.dispatch(
        actions.updateAi({
          losses: rs.ai.losses + 1,
        }),
      );
      message = `You won!`;
      playSound("win", 1);
    } else {
      store.dispatch(
        actions.updateAi({
          draws: rs.ai.draws + 1,
        }),
      );
    }

    store.dispatch(
      info({
        title: "Game over!",
        message,
      }),
    );

    await delay(animDuration * 2);
    store.dispatch(actions.newGame({}));
    return;
  }

  let nextPlayer = swapPlayers ? swapColor(previousPlayer) : previousPlayer;
  if (hasEmptyDeck(rs, nextPlayer)) {
    store.dispatch(
      info({
        title: "Passing",
        message: `${colorName(nextPlayer)} has no cards left.`,
      }),
    );
    nextPlayer = swapColor(nextPlayer);
  }

  store.dispatch(
    actions.nextTurn({
      turnPlayer: nextPlayer,
    }),
  );
}

function hasEmptyDeck(rs: IRootState, color: Color): boolean {
  return rs.game.decks[color].length == 0;
}
