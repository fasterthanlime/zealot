import { IStore } from "../types/index";

const { Howl } = require("howler");

let sounds = {
  cardflick1: new Howl({ src: require("../sfx/cardflick1.ogg").default }),
  cardflick2: new Howl({ src: require("../sfx/cardflick2.ogg").default }),
  cardflick3: new Howl({ src: require("../sfx/cardflick3.ogg").default }),
  cardflick4: new Howl({ src: require("../sfx/cardflick4.ogg").default }),

  cardplace1: new Howl({ src: require("../sfx/cardplace1.ogg").default }),
  cardplace2: new Howl({ src: require("../sfx/cardplace2.ogg").default }),
  cardplace3: new Howl({ src: require("../sfx/cardplace3.ogg").default }),
  cardplace4: new Howl({ src: require("../sfx/cardplace4.ogg").default }),
  cardplace5: new Howl({ src: require("../sfx/cardplace5.ogg").default }),

  win1: new Howl({ volume: 0.6, src: require("../sfx/win.ogg").default }),
  lose1: new Howl({ volume: 0.6, src: require("../sfx/lose.ogg").default }),
};

let musics = {
  track1: new Howl({
    volume: 0.6,
    src: require("../music/track1.ogg").default,
  }),
  track2: new Howl({
    volume: 0.6,
    src: require("../music/track2.ogg").default,
  }),
  track3: new Howl({
    volume: 0.6,
    src: require("../music/track3.ogg").default,
  }),
  track4: new Howl({
    volume: 0.6,
    src: require("../music/track4.ogg").default,
  }),
  track5: new Howl({
    volume: 0.6,
    src: require("../music/track5.ogg").default,
  }),
  track6: new Howl({
    volume: 0.6,
    src: require("../music/track6.ogg").default,
  }),
  track7: new Howl({
    volume: 0.6,
    src: require("../music/track7.ogg").default,
  }),
  track8: new Howl({
    volume: 0.6,
    src: require("../music/track8.ogg").default,
  }),
};

import * as _ from "underscore";

export function watchMusic(store: IStore) {
  let currentPlaylist: any[] = [];
  let currentSong: any = null;

  setInterval(() => {
    const enabled = store.getState().settings.musicEnabled;
    if (!enabled) {
      currentPlaylist.length = 0;
      if (currentSong) {
        currentSong.stop();
        currentSong = null;
      }
      return;
    }

    if (currentPlaylist.length == 0) {
      currentPlaylist = _.shuffle(musics);
    }

    if (!currentSong) {
      currentSong = currentPlaylist.shift();
      console.log("playing ", currentSong);
      currentSong.once("end", () => {
        currentSong = null;
      });
      currentSong.play();
    }
  }, 400);
}

export function playSound(name: string, num = 4) {
  let index = Math.floor(1 + Math.random() * num);
  const key = `${name}${index}`;
  const sound = sounds[key];
  if (sound) {
    sound.play();
  } else {
    console.warn(`No such sfx: ${key}`);
  }
}

export function playCardFlick() {
  playSound("cardflick", 4);
}

export function playCardPlace() {
  playSound("cardplace", 5);
}
