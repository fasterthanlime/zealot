import { Watcher } from "./watcher";

import boot from "./boot";
import game from "./game";

export default function getWatcher() {
  const watcher = new Watcher();
  boot(watcher);
  game(watcher);

  watcher.validate();
  return watcher;
}
