import { createStore } from "redux";
import reducer from "../reducers";
import route from "../reactors/route";
import { IStore } from "../types/index";
import getWatcher from "../reactors/index";

const store = createStore(reducer) as IStore;
const watcher = getWatcher();

let originalDispatch = store.dispatch;
store.dispatch = (action: any) => {
  route(watcher, store, action);
  return originalDispatch(action);
};

store.watcher = watcher;

export default store;
