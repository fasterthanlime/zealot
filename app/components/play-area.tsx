import * as React from "react";
import Deck from "./deck";
import Board from "./board";
import Draggerino from "./draggerino";

import styled from "./styles";
import {
  Color,
  ISystemState,
  IRootState,
  IMetricsState,
  IGameState,
  IDraggable,
  IControlsState,
  ICard,
  getSquare,
} from "../types/index";
import { connect } from "./connect";

import { map } from "underscore";

import Square, { SquareWidth, SquareHeight } from "./square";

const ReactHintFactory = require("react-hint");
const ReactHint = ReactHintFactory(React);

const PlayAreaDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WrapperDiv = styled.div`
  position: relative;
  perspective: 600px;
  transform-style: preserve-3d;
`;

class PlayArea extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const newSystem = 1;
    if (newSystem == 1) {
      const { system, metrics, game } = this.props;
      if (!metrics.decks) {
        return <div>Loading...</div>;
      }

      const { clientWidth, clientHeight } = system;
      const wrapperStyle: React.CSSProperties = {
        width: `${clientWidth}px`,
        height: `${clientHeight}px`,
      };
      let cards: {
        [key: string]: JSX.Element;
      } = {};

      let draggedCard: ICard = null;
      const { controls } = this.props;
      if (controls.draggable) {
        const { draggable } = controls;
        draggedCard = game.decks[draggable.player].cards[draggable.index];
      }

      for (const color of [Color.Red, Color.Blue]) {
        const deck = game.decks[color];
        const deckMetrics = metrics.decks[color];

        let metricIndex = 0;
        for (let i = 0; i < deck.cards.length; i++) {
          const card = deck.cards[i];
          if (!card) {
            continue;
          }
          const cardStyle: React.CSSProperties = {
            transform: `translate3d(${deckMetrics.offset.x +
              deckMetrics.increment.x * metricIndex}px, ${
              deckMetrics.offset.y
            }px, ${metricIndex * 0.2}px) rotateX(${
              color === Color.Red ? 3 : -3
            }deg)`,
          };
          metricIndex++;

          if (draggedCard && draggedCard.id === card.id) {
            const { mouse } = controls;
            const x = mouse.x - SquareWidth * 0.5;
            const y = mouse.y - SquareHeight * 0.5;
            cardStyle.transform = `translate3d(${x}px, ${
              y
            }px, 40px) rotateX(0deg)`;
            cardStyle.transition = "initial";
            cardStyle.pointerEvents = "none";
          }

          const draggable: IDraggable = {
            index: i,
            player: color,
          };
          cards[card.id] = (
            <Square
              key={card.id}
              style={cardStyle}
              card={card}
              draggable={draggable}
              color={color}
            />
          );
        }
      }

      const { board } = game;
      for (let col = 0; col < board.numCols; col++) {
        for (let row = 0; row < board.numRows; row++) {
          const x =
            metrics.playAreaOffset.x + col * metrics.playAreaIncrement.x;
          const y =
            metrics.playAreaOffset.y + row * metrics.playAreaIncrement.y;
          const cardStyle: React.CSSProperties = {
            transform: `translate(${x}px, ${y}px) rotateX(0deg)`,
          };
          cards[`target-${col}-${row}`] = (
            <Square
              key={`target-${col}-${row}`}
              style={cardStyle}
              dropTarget={{
                col,
                row,
              }}
            />
          );

          const square = getSquare(board, col, row);
          if (square && square.card) {
            const { card, color } = square;

            cards[card.id] = (
              <Square
                key={card.id}
                style={cardStyle}
                onBoard
                color={color}
                card={card}
              />
            );
          }
        }
      }

      return (
        <WrapperDiv style={wrapperStyle}>
          {map(Object.keys(cards).sort(), key => cards[key])}
        </WrapperDiv>
      );
    }

    return (
      <PlayAreaDiv>
        <ReactHint events delay={100} />
        <Draggerino />
        <Deck player={Color.Red} />
        <Board />
        <Deck player={Color.Blue} />
      </PlayAreaDiv>
    );
  }
}

interface IProps {}

interface IDerivedProps {
  system: ISystemState;
  metrics: IMetricsState;
  game: IGameState;
  controls: IControlsState;
}

export default connect<IProps>(PlayArea, {
  state: (rs: IRootState) => ({
    system: rs.system,
    metrics: rs.metrics,
    game: rs.game,
    controls: rs.controls,
  }),
});
