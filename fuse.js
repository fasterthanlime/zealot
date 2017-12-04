const {
  FuseBox,
  CopyPlugin,
  CSSResourcePlugin,
  CSSPlugin,
  QuantumPlugin,
  WebIndexPlugin,
} = require("fuse-box");

let environment = "development";
if (process.env.NODE_ENV === "production") {
  environment = "production";
} else if (process.env.NODE_ENV === "staging") {
  environment = "staging";
}

const isDevelopment = environment === "development";

const outFolder = `public/${environment}`;

const fuse = FuseBox.init({
  homeDir: "app",
  output: outFolder + "/$name.js",
  sourceMaps: isDevelopment,
  hash: !isDevelopment,
  plugins: [
    [
      "global-styles.css",
      CSSPlugin()
    ],
    ["node_modules/react-hint/css/*.css",
      CSSResourcePlugin({
          dist: outFolder + "/css2",
          resolve: (f) => `/css2/${f}`,
      }),
      CSSPlugin()
    ],
    [
      "icomoon/style.css",
      CSSResourcePlugin({
        dist: outFolder + "/fonts",
        resolve: (f) => `/fonts/${f}`,
      }),
      CSSPlugin(),
    ],
    CopyPlugin({
      files: [
        "images/**/*.png",
        "sfx/*.wav",
        "sfx/*.ogg"
      ],
    }),
    WebIndexPlugin({
      title: "Zealot — LD 40",
      template: "./app/index.template.html"
    }),
    !isDevelopment &&
      QuantumPlugin({
        target: "browser",
      }),
  ],
});

var appBundle = fuse
  .bundle("app")
  .target("browser")
  .instructions(`>index.tsx`);

if (isDevelopment) {
  appBundle.watch();
  fuse.dev();
}

fuse.run();
