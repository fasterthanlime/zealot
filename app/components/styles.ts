export const baseColors = {
  codGray: "#1d1c1c",
  darkMineShaft: "#2e2b2c",
  lightMineShaft: "#383434",
  zambezi: "#5d5757",
  silverChalice: "#a0a0a0",
  swissCoffee: "#dad2d2",
  ivory: "#fffff0",

  flushMahogany: "#d14343",
  mintJulep: "#efeebf",
  gossip: "#b9e8a1",

  shamrock: "#24c091",
  amber: "#ffc200",
  heliotrope: "#c17dff",

  carnation: "#fa5c5c",
  vividTangerine: "#ff8080",
};

export const colors = {
  accent: baseColors.carnation,
  lightAccent: baseColors.vividTangerine,

  black: "#1b1c33",
  orange: "#da7d22",
  purple: "#7b53ad",
};

export const hexColors = {
  black: 0x1b1c33,
  orange: 0xda7d22,
  purple: 0x7b53ad,
};

export const fontSizes = {
  baseText: "15px",
  large: "18px",
  huge: "24px",
  incredible: "38px",
};

export const fonts = {
  base: "Lato, sans-serif",
};

export const widths = {};

export const theme = {
  ...colors,
  baseColors,
  fontSizes,
  fonts,
  widths,
};

export type ITheme = typeof theme;
export interface IThemeProps {
  theme: ITheme;
}

import * as styledComponents from "styled-components";
import { ThemedStyledComponentsModule } from "styled-components";
const {
  default: styled,
  css,
  injectGlobal,
  keyframes,
  ThemeProvider,
} = (styledComponents as any) as ThemedStyledComponentsModule<ITheme>;

export default styled;
export { css, injectGlobal, keyframes, ThemeProvider };

export const animations = {
  beating: keyframes`
    0% {
      transform: scale(0.88);
    }
    4% {
      transform: scale(0.97);
    }
    8% {
      transform: scale(0.88);
    }

    20% {
      transform: scale(0.88);
    }
    24% {
      transform: scale(0.94);
    }
    28% {
      transform: scale(0.88);
    }

    100% {
      transform: scale(0.88);
    }
  `,

  shake: keyframes`
    10%, 90% {
      transform: translate3d(-1px, 0, 0);
    }
    
    20%, 80% {
      transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
      transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
      transform: translate3d(4px, 0, 0);
    }
  `,
};
