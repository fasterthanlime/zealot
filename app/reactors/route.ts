import { IStore, IAction } from "../types";

import { Watcher } from "./watcher";

let printError = (msg: string) => {
  console.error(msg);
};

const emptyArr = [];

function err(e: Error, action: IAction<any>) {
  printError(
    `while reacting to ${(action || { type: "?" }).type}: ${e.stack || e}`,
  );
}

export default async function route(
  watcher: Watcher,
  store: IStore,
  action: IAction<any>,
) {
  setTimeout(() => {
    try {
      for (const r of watcher.reactors[action.type] || emptyArr) {
        r(store, action).catch(e => {
          err(e, action);
        });
      }

      for (const sub of watcher.subs) {
        if (!sub) {
          continue;
        }

        for (const r of sub.reactors[action.type] || emptyArr) {
          r(store, action).catch(e => {
            err(e, action);
          });
        }
      }
    } catch (e) {
      const e2 = new Error(
        `Could not route action, original stack:\n${e.stack}`,
      );
      err(e2, action);
    }
  }, 0);
}
