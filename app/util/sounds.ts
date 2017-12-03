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

  birds1: new Howl({ src: require("../sfx/birds1.ogg").default }),
};

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
