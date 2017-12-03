import {
  IRootState,
  IOffset,
  Color,
  IDeckMetrics,
  IMetricsState,
} from "../types/index";
import { SquareHeight, SquareWidth } from "../components/square";

const deckMargin = 10;
const playAreaMargin = 10;
const globalMargin = 20;

export function getMetrics(rs: IRootState): IMetricsState {
  const { board, decks } = rs.game;

  if (!board) {
    return null;
  }

  const { clientWidth } = rs.system;
  const deckHeight = SquareHeight + deckMargin * 2;

  const deckCardStart = 80;

  const topDeckOffset: IOffset = {
    x: deckCardStart,
    y: globalMargin,
  };

  const playAreaIncrement: IOffset = {
    x: SquareWidth + playAreaMargin,
    y: SquareHeight + playAreaMargin,
  };
  const playAreaWidth = playAreaIncrement.x * board.numCols;
  const playAreaHeight = playAreaIncrement.y * board.numRows;
  const playAreaX = clientWidth * 0.5 - playAreaWidth * 0.5;

  const playAreaOffset: IOffset = {
    x: playAreaX,
    y: topDeckOffset.y + globalMargin + deckHeight,
  };

  const pileDimensions: IOffset = {
    x: SquareWidth + globalMargin * 2,
    y: SquareHeight + globalMargin * 2,
  };
  const dealPileOffset: IOffset = {
    x: playAreaOffset.x - pileDimensions.x - globalMargin,
    y: playAreaOffset.y + playAreaHeight * 0.5 - pileDimensions.y * 0.5,
  };
  const trashPileOffset: IOffset = {
    x: playAreaOffset.x + playAreaWidth + pileDimensions.x + globalMargin,
    y: playAreaOffset.y + playAreaHeight * 0.5 - pileDimensions.y * 0.5,
  };

  const bottomDeckOffset: IOffset = {
    x: deckCardStart,
    y: playAreaOffset.y + globalMargin + playAreaHeight,
  };

  const countCards = (color: Color): number => {
    let numCards = 0;
    const { cards } = decks[color];
    for (let i = 0; i < cards.length; i++) {
      if (cards[i]) {
        numCards++;
      }
    }
    return numCards;
  };

  const layoutDeck = (color: Color, deckOffset: IOffset): IDeckMetrics => {
    let numCards = countCards(color);
    let margin = 10;

    let increment = SquareWidth + margin;
    const maxDeckWidth = clientWidth - 80;
    let maxTries = 20;
    while (increment * (numCards + 2) > maxDeckWidth) {
      increment *= 0.93;
      if (maxTries-- <= 0) {
        break;
      }
    }

    return {
      offset: deckOffset,
      height: deckHeight,
      increment: {
        x: increment,
        y: 0,
      },
    };
  };

  const metrics: IMetricsState = {
    playAreaOffset,
    playAreaIncrement,
    dealPileOffset,
    trashPileOffset,
    decks: {
      [Color.Red]: layoutDeck(Color.Red, topDeckOffset),
      [Color.Blue]: layoutDeck(Color.Blue, bottomDeckOffset),
    },
  };

  return metrics;
}
