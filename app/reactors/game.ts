import { Watcher } from "./watcher";
import * as actions from "../actions";
import {
  isCivilian,
  getSquare,
  suitName,
  swapColor,
  IStore,
  Color,
  AreaType,
  getDraggedCard,
  getCardAreaType,
  colorName,
  aiColor,
} from "../types/index";

import { warning, info } from "react-notification-system-redux";
import { playCardFlick, playCardPlace, playSound } from "../util/sounds";
import {
  computeOutcome,
  Outcome,
  applyMove,
  hasLegalPlays,
  randomPlay,
} from "../util/rules";
import { playAI } from "../util/original-ai";
import { playAILight } from "../util/light-ai";
import { IPlayCardPayload } from "../actions";

const dealWait = 250;
const gameOverWait = 1000;

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

export async function playOriginalAI(store: IStore) {
  store.dispatch(actions.updateAi({ thinking: true }));
  const rs = store.getState();
  let { game } = rs;
  const { turnPlayer } = rs.controls;

  // old AI
  const node = await playAI(store, game, turnPlayer);
  store.dispatch(
    actions.updateAi({
      thinking: false,
    }),
  );
  store.dispatch(actions.playCard(node.play));
}

export async function playLightAI(store: IStore) {
  store.dispatch(actions.updateAi({ thinking: true }));
  const rs = store.getState();
  let { game } = rs;
  const { turnPlayer } = rs.controls;
  const lightNode = await playAILight(store, game, turnPlayer);
  store.dispatch(
    actions.updateAi({
      thinking: false,
    }),
  );

  let heavyPlay: IPlayCardPayload = null;
  if (lightNode.p.length > 0) {
    let [deckIndex, boardIndex] = lightNode.p;
    let row = Math.floor(boardIndex / game.board.numCols);
    let col = boardIndex - row * game.board.numCols;
    heavyPlay = {
      col,
      row,
      index: deckIndex,
      player: turnPlayer,
    };
  }
  store.dispatch(actions.playCard(heavyPlay));
}

export async function playRandomAI(store: IStore) {
  store.dispatch(actions.updateAi({ thinking: true }));
  const rs = store.getState();
  let { game } = rs;
  const { turnPlayer } = rs.controls;
  const play = randomPlay(game, turnPlayer);
  store.dispatch(actions.playCard(play));
  store.dispatch(actions.updateAi({ thinking: false }));
}

export default function(watcher: Watcher) {
  watcher.on(actions.nextTurn, async (store, action) => {
    const { turnPlayer } = action.payload;
    if (true) {
      // await delay(200);

      if (turnPlayer === Color.Red) {
        // await playOriginalAI(store);
        await playLightAI(store);
      } else {
        // await playLightAI(store);
      }
      // favicon.badge(1);
    }
  });

  watcher.on(actions.updateAi, async (store, action) => {
    const rs = store.getState();
    if (
      action.payload.optionsOpen === false &&
      rs.controls.outcome === Outcome.Neutral &&
      rs.controls.hasActiveGame === false
    ) {
      store.dispatch(actions.newGame({}));
    }
  });

  watcher.on(actions.replay, async (store, action) => {
    const rs = store.getState();
    let { lastMove } = rs.controls;
    if (!lastMove) {
      console.log("can't replay, no last move");
      // welp
      return;
    }

    console.log("replaying: ", lastMove);

    store.dispatch(
      actions.loadState({
        game: lastMove.game,
        score: lastMove.score,
        play: lastMove.play,
      }),
    );

    const { game, play } = lastMove;
    const { col, row } = play;
    const card = game.decks[play.player][play.index];

    let who = play.player === aiColor ? "AI" : "You";
    let nextGame = applyMove(lastMove.game, lastMove.play);
    let outcome = computeOutcome(nextGame, lastMove.play.player);

    let consequence = ".";
    if (outcome === Outcome.Win) {
      consequence = " and won.";
    } else if (outcome === Outcome.Loss) {
      consequence = " and lost.";
    } else if (outcome === Outcome.Draw) {
      consequence = " and forced a draw.";
    }

    let onWhat = "empty square";
    const bcard = getSquare(game.board, col, row);
    if (bcard) {
      onWhat = `${colorName(bcard.color)} ${suitName(bcard.suit)}`;
    }

    store.dispatch(
      info({
        title: "Action replay",
        message: `${who} played a ${suitName(card.suit)} on ${onWhat} at ${
          col
        },${row}${consequence}`,
      }),
    );

    await delay(gameOverWait);
    store.dispatch(actions.playCard(lastMove.play));
  });

  watcher.on(actions.playCard, async (store, action) => {
    const rs = store.getState();

    store.dispatch(actions.endTurn({}));

    if (action.payload) {
      playCardPlace();
      store.dispatch(
        actions.saveState({
          game: rs.game,
          score: rs.score,
          play: action.payload,
        }),
      );
      store.dispatch(actions.cardPlayed(action.payload));
    } else {
      store.dispatch(
        info({
          title: "Passing",
          message: `${colorName(rs.controls.turnPlayer)} player passed`,
        }),
      );
    }

    await doNextTurn(store, rs.controls.turnPlayer, true);
  });

  watcher.on(actions.newGame, async (store, action) => {
    await delay(dealWait);
    store.dispatch(actions.dealAll({}));
    await delay(dealWait);
    store.dispatch(
      actions.nextTurn({ turnPlayer: Color.Blue, canPass: false }),
    );
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

  let nextPlayer = swapPlayers ? swapColor(previousPlayer) : previousPlayer;
  const nextHasLegalPlays = hasLegalPlays(rs.game, nextPlayer);
  if (!nextHasLegalPlays && !hasLegalPlays(rs.game, swapColor(nextPlayer))) {
    let playerOutcome = computeOutcome(
      rs.game,
      swapColor(aiColor),
      true /* force outcome */,
    );

    if (playerOutcome === Outcome.Win) {
      playSound("win", 1);
    } else if (playerOutcome === Outcome.Loss) {
      playSound("lose", 1);
    }

    await delay(gameOverWait);
    store.dispatch(actions.gameOver({ outcome: playerOutcome }));
    return;
  }

  store.dispatch(
    actions.nextTurn({
      turnPlayer: nextPlayer,
      canPass: !nextHasLegalPlays,
    }),
  );
}
