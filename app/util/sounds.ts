const { Howl } = require("howler");

let sounds = {
  Monk1: new Howl({ src: require("../sfx/Monk1.wav").default }),
  Monk2: new Howl({ src: require("../sfx/Monk2.wav").default }),
  Monk3: new Howl({ src: require("../sfx/Monk3.wav").default }),
  Monk4: new Howl({ src: require("../sfx/Monk4.wav").default }),

  Goblin1: new Howl({ src: require("../sfx/Goblin1.wav").default }),
  Goblin2: new Howl({ src: require("../sfx/Goblin2.wav").default }),
  Goblin3: new Howl({ src: require("../sfx/Goblin3.wav").default }),
  Goblin4: new Howl({ src: require("../sfx/Goblin4.wav").default }),

  Priest1: new Howl({ src: require("../sfx/Priest1.wav").default }),
  Priest2: new Howl({ src: require("../sfx/Priest2.wav").default }),
  Priest3: new Howl({ src: require("../sfx/Priest3.wav").default }),
  Priest4: new Howl({ src: require("../sfx/Priest4.wav").default }),

  Peasant1: new Howl({ src: require("../sfx/Peasant1.wav").default }),
  Peasant2: new Howl({ src: require("../sfx/Peasant2.wav").default }),
  Peasant3: new Howl({ src: require("../sfx/Peasant3.wav").default }),
  Peasant4: new Howl({ src: require("../sfx/Peasant4.wav").default }),

  Marksman1: new Howl({ src: require("../sfx/Marksman1.wav").default }),
  Marksman2: new Howl({ src: require("../sfx/Marksman2.wav").default }),
  Marksman3: new Howl({ src: require("../sfx/Marksman3.wav").default }),
  Marksman4: new Howl({ src: require("../sfx/Marksman4.wav").default }),

  Necromance1: new Howl({ src: require("../sfx/Necromance1.wav").default }),
  Necromance2: new Howl({ src: require("../sfx/Necromance2.wav").default }),
  Necromance3: new Howl({ src: require("../sfx/Necromance3.wav").default }),
  Necromance4: new Howl({ src: require("../sfx/Necromance4.wav").default }),

  Martyr1: new Howl({ src: require("../sfx/Martyr1.wav").default }),
  Martyr2: new Howl({ src: require("../sfx/Martyr2.wav").default }),
  Martyr3: new Howl({ src: require("../sfx/Martyr3.wav").default }),
  Martyr4: new Howl({ src: require("../sfx/Martyr4.wav").default }),
};

export function playSound(name: string) {
  let index = Math.floor(1 + Math.random() * 4);
  const key = `${name}${index}`;
  const sound = sounds[key];
  if (sound) {
    sound.play();
  } else {
    console.warn(`No such sfx: ${key}`);
  }
}
