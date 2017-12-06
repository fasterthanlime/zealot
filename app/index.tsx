import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./components/app";

import { theme, ThemeProvider } from "./components/styles";
import store from "./store";
import { Provider } from "react-redux";
import * as actions from "./actions";
import { watchMusic } from "./util/sounds";

require("./global-styles.css");
require("./icomoon/style.css");
require("react-hint/css/index.css");

function main() {
  const appDiv = document.querySelector("#app");

  const updateSize = () => {
    const { clientWidth, clientHeight } = document.body;
    const { system } = store.getState();
    if (
      system.clientWidth != clientWidth ||
      system.clientHeight != clientHeight
    ) {
      store.dispatch(actions.viewportResized({ clientWidth, clientHeight }));
    }
  };
  updateSize();
  setInterval(updateSize, 1000);

  ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </Provider>,
    appDiv,
  );
  store.dispatch(actions.boot({}));

  document.addEventListener("mouseup", () => {
    store.dispatch(actions.dragEnd({}));
  });

  document.addEventListener("keyup", (ev: KeyboardEvent) => {
    if (ev.key === "Escape") {
      store.dispatch(
        actions.updateAi({
          optionsOpen: false,
        }),
      );
    }
  });

  watchMusic(store);
}

main();
