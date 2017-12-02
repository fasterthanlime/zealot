import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "./components/app";

import { theme, ThemeProvider } from "./components/styles";
import store from "./store";
import { Provider } from "react-redux";
import * as actions from "./actions";

require("./global-styles.css");
require("./icomoon/style.css");

function main() {
  const appDiv = document.querySelector("#app");

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

  document.addEventListener("mousemove", e => {
    store.dispatch(
      actions.mouseMove({
        x: e.clientX,
        y: e.clientY,
      }),
    );
  });
}

main();
