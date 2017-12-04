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
import { playCardFlick, playCardPlace } from "../util/sounds";
import {
  IPotentialGame,
  simulateGame,
  printGames,
  Outcome,
} from "../util/rules";
import { sortBy, first } from "underscore";

const dealWait = 80;
const animDuration = 600;
const clearDuration = 1000;
// const aiThinkTime = 1000;

const aiColor = Color.Red;

export default function(watcher: Watcher) {
  watcher.on(actions.nextTurn, async (store, action) => {
    if (action.payload.turnPlayer === aiColor) {
      // await delay(aiThinkTime);

      const rs = store.getState();
      let { game } = rs;

      let potentialGames: IPotentialGame[] = [];
      let tries = 5000;

      for (let k = 0; k < tries; k++) {
        let potentialGame = simulateGame(game, aiColor);
        if (potentialGame) {
          potentialGames.push(potentialGame);
        }
      }

      if (potentialGames.length > 0) {
        let outcomes: any = {};
        for (const pg of potentialGames) {
          const key = Outcome[pg.outcome];
          if (!outcomes[key]) {
            outcomes[key] = 0;
          }
          outcomes[key]++;
        }
        console.log(`number of outcomes: `, JSON.stringify(outcomes));

        potentialGames = sortBy(potentialGames, pg => -pg.outcome);
        potentialGames = first(potentialGames, 5);
        printGames(game, potentialGames);
        store.dispatch(actions.playCard(potentialGames[0].play));
      } else {
        store.dispatch(actions.pass({}));
      }
    }
  });

  watcher.on(actions.playCard, async (store, action) => {
    store.dispatch(actions.endTurn({}));

    const rs = store.getState();

    const { player, index } = action.payload;
    const card = rs.game.decks[player].cards[index];
    let swapPlayers = !isCivilian(card.suit);

    playCardPlace();
    store.dispatch(actions.cardPlayed(action.payload));

    await doNextTurn(store, rs.controls.turnPlayer, swapPlayers);
  });

  watcher.on(actions.newGame, async (store, action) => {
    while (true) {
      const { dealPile } = store.getState().game;
      if (dealPile.length === 0) {
        store.dispatch(actions.doneDealing({}));
        store.dispatch(actions.nextTurn({ turnPlayer: Color.Red }));
        return;
      }

      await delay(dealWait);
      store.dispatch(actions.dealNext({}));
    }
  });

  watcher.on(actions.pass, async (store, action) => {
    const { controls } = store.getState();
    store.dispatch(actions.endTurn({}));
    await doNextTurn(store, controls.turnPlayer, true);
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

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function doNextTurn(
  store: IStore,
  previousPlayer: Color,
  swapPlayers: boolean,
) {
  setTimeout(() => {
    try {
      store.dispatch(actions.clearEffects({}));
    } catch (e) {
      // meh
    }
  }, clearDuration);

  const rs = store.getState();
  if (hasEmptyDeck(rs, Color.Red) && hasEmptyDeck(rs, Color.Blue)) {
    const r = rs.game.counts[Color.Red];
    const b = rs.game.counts[Color.Blue];
    let message = `It's a draw! (${r} vs ${b})`;

    if (r < b) {
      message = `Player ${colorName(Color.Red)} has won! (${r} vs ${
        b
      } for ${colorName(Color.Blue)})`;
    } else if (b < r) {
      message = `Player ${colorName(Color.Blue)} has won! (${b} vs ${
        r
      } for ${colorName(Color.Red)})`;
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

  if (swapPlayers) {
    // double delay!
    await delay(animDuration * 2);
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
  const { cards } = rs.game.decks[color];
  for (const card of cards) {
    if (card) {
      return false;
    }
  }
  return true;
}
