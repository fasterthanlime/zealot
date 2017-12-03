import {
  IRootState,
  IOffset,
  Color,
  IDeckMetrics,
  deckSize,
  IMetricsState,
} from "../types/index";
import { SquareHeight, SquareWidth } from "../components/square";

const deckMargin = 10;
const playAreaMargin = 10;

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
    y: 0,
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
    y: topDeckOffset.y + deckHeight,
  };

  const bottomDeckOffset: IOffset = {
    x: deckCardStart,
    y: playAreaOffset.y + playAreaHeight,
  };

  const countCards = (color: Color): number => {
    let numCards = 0;
    const { cards } = decks[Color.Red];
    for (let i = 0; i < cards.length; i++) {
      if (cards[i]) {
        numCards++;
      }
    }
    return numCards;
  };

  const layoutDeck = (color: Color, deckOffset: IOffset): IDeckMetrics => {
    let cardOffsets: IOffset[] = [];
    let numCards = countCards(color);
    numCards = numCards;
    let margin = 10;

    for (let i = 0; i < deckSize; i++) {
      const cardOffset: IOffset = {
        x: deckOffset.x + (SquareWidth + margin) * i,
        y: deckOffset.y,
      };
      cardOffsets.push(cardOffset);
    }

    return {
      offset: deckOffset,
      cardOffsets,
      height: deckHeight,
    };
  };

  const metrics: IMetricsState = {
    playAreaOffset,
    playAreaIncrement,
    decks: {
      [Color.Red]: layoutDeck(Color.Red, topDeckOffset),
      [Color.Blue]: layoutDeck(Color.Blue, bottomDeckOffset),
    },
  };

  return metrics;
}
