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
} from "../types/index";

import { warning, info } from "react-notification-system-redux";
import { playCardFlick, playCardPlace } from "../util/sounds";

const animDuration = 400;
const clearDuration = 1000;

export default function(watcher: Watcher) {
  watcher.on(actions.pass, async (store, action) => {
    const { controls } = store.getState();
    store.dispatch(actions.endTurn({}));
    await doNextTurn(store, controls.turnPlayer);
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
    const sq = getSquare(board, col, row);

    let valid = true;
    let areaType = AreaType.Single;

    if (sq && sq.card) {
      if (isCivilian(draggedCard.suit)) {
        // civilians can only go on empty squares
        valid = false;
      } else {
        areaType = getCardAreaType(sq.card);
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
    playCardPlace();

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
          await delay(animDuration);
          store.dispatch(actions.clearEffects({}));
          return;
        }
      }

      store.dispatch(actions.endTurn({}));

      store.dispatch(
        actions.playCard({
          player: draggable.player,
          index: draggable.index,
          col: dropTarget.col,
          row: dropTarget.row,
        }),
      );
      await doNextTurn(store, controls.turnPlayer);
    }
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function doNextTurn(store: IStore, previousPlayer: Color) {
  setTimeout(() => {
    try {
      store.dispatch(actions.clearEffects({}));
    } catch (e) {
      // meh
    }
  }, clearDuration);
  await delay(animDuration);

  const rs = store.getState();
  if (hasEmptyDeck(rs, Color.Red) && hasEmptyDeck(rs, Color.Blue)) {
    const r = rs.game.counts[Color.Red];
    const b = rs.game.counts[Color.Blue];
    let message = `It's a draw! (${r} vs ${b})`;

    if (r < b) {
      message = `Player red has won! (${r} vs ${b} for blue)`;
    } else if (b < r) {
      message = `Player blue has won! (${b} vs ${r} for red)`;
    }

    store.dispatch(
      info({
        title: "Game over!",
        message,
      }),
    );

    await delay(animDuration);
    store.dispatch(actions.newGame({}));
  }

  store.dispatch(
    actions.nextTurn({
      turnPlayer: swapColor(previousPlayer),
    }),
  );
}

function hasEmptyDeck(rs: IRootState, color: Color): boolean {
  const { cards } = rs.game.decks[color];
  for (const card of cards) {
    if (card) {
      return false;
    }
  }
  return true;
}
