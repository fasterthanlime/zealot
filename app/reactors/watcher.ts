import { IStore, IRootState, IAction } from "../types";
import * as actions from "../actions";

import { each } from "underscore";

export interface IReactor<T> {
  (store: IStore, action: IAction<T>): Promise<void>;
}

interface Schedule {
  (f: () => void): void;
  dispatch?: (a: IAction<any>) => void;
}
type Selector = (rs: IRootState) => void;
type SelectorMaker = (store: IStore, schedule: Schedule) => Selector;

/**
 * Allows reacting to certain actions being dispatched
 */
export class Watcher {
  reactors: {
    [key: string]: IReactor<any>[];
  };

  subs: Watcher[];

  constructor() {
    this.reactors = {};
    this.subs = [];
  }

  /**
   * Registers a lazily-created reselect selector that will be called
   * on every tick if the state has changed since the last tick
   */
  onStateChange({ makeSelector }: { makeSelector: SelectorMaker }) {
    let oldRs: IRootState = null;
    let selector: Selector;

    const actionName = "TICK";
    this.addWatcher(actionName, async (store, action) => {
      let rs = store.getState();
      if (rs === oldRs) {
        return;
      }
      oldRs = rs;

      if (!selector) {
        const schedule: Schedule = f => {
          setImmediate(() => {
            try {
              f();
            } catch (e) {
              console.error(`In scheduled stateChange: ${e.stack}`);
            }
          });
        };
        schedule.dispatch = (action: IAction<any>) => {
          schedule(() => store.dispatch(action));
        };
        selector = makeSelector(store, schedule);
      }

      try {
        selector(rs);
      } catch (e) {
        console.error(`In state selector: ${e.stack}`);
      }
    });
  }

  /**
   * Registers a reactor for a given action
   */
  on<T>(
    actionCreator: (payload: T) => IAction<T>,
    reactor: (store: IStore, action: IAction<T>) => Promise<void>,
  ) {
    // create a dummy action to get the type
    const type = actionCreator(({} as any) as T).type;
    this.addWatcher(type, reactor);
  }

  validate() {
    each(Object.keys(this.reactors), key => {
      if (!actions.types.hasOwnProperty(key)) {
        throw new Error(`trying to react to unknown action type ${key}`);
      }
    });
  }

  addSub(watcher: Watcher) {
    this.subs.push(watcher);
  }

  removeSub(watcher: Watcher) {
    const index = this.subs.indexOf(watcher);
    if (index !== -1) {
      this.subs.splice(index, 1);
    }
  }

  protected addWatcher(type: string, reactor: IReactor<any>) {
    if (!this.reactors[type]) {
      this.reactors[type] = [];
    }
    this.reactors[type].push(reactor);
  }
}
