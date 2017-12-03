import * as React from "react";

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
  forEachAreaSquare,
} from "../types/index";
import { connect } from "./connect";

import { map } from "underscore";

import Square, { SquareWidth, SquareHeight } from "./square";
import Slot from "./slot";
import Highlight from "./highlight";
import * as actions from "../actions";

const ReactHintFactory = require("react-hint");
const ReactHint = ReactHintFactory(React);

const WrapperDiv = styled.div`
  position: relative;
  perspective: 600px;
  transform-style: preserve-3d;
`;

const PassDiv = styled.div`
  position: absolute;
  font-size: 28px;
  padding: 12px;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;

  &:hover {
    cursor: pointer;
    border-color: rgba(255, 255, 255, 0.9);
  }
`;

const CoverDiv = styled.div`
  position: absolute;
  background: rgba(12, 12, 12, 0.5);
  transition: transform 0.32s, opacity 0.32s;
`;

class PlayArea extends React.PureComponent<IProps & IDerivedProps> {
  render() {
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
    let passes: JSX.Element[] = [];
    let covers: JSX.Element[] = [];
    let slots: JSX.Element[] = [];
    let highlights: JSX.Element[] = [];

    let draggedCard: ICard = null;
    const { controls } = this.props;
    let litSquares = [];
    let invalidDropTarget = false;
    if (controls.draggable) {
      const { draggable } = controls;
      draggedCard = game.decks[draggable.player].cards[draggable.index];

      const cdt = controls.dropTarget;
      if (cdt) {
        invalidDropTarget = !cdt.valid;
        forEachAreaSquare(
          game.board,
          cdt.col,
          cdt.row,
          cdt.areaType,
          (col, row, square) => {
            litSquares.push(square);
          },
        );
      }
    }

    for (const color of [Color.Red, Color.Blue]) {
      const ourTurn = color === controls.turnPlayer;
      const deck = game.decks[color];
      const deckMetrics = metrics.decks[color];
      const xAngle = color === Color.Red ? 3 : -3;

      if (true) {
        const hiding = !(ourTurn && controls.awaitingInput);
        let z = -4;
        if (hiding) {
          z = 4;
        }
        const x = 0;
        const y = deckMetrics.offset.y;
        const coverStyle: React.CSSProperties = {
          transform: `translate3d(${x}px, ${y - 10}px, ${z}px) rotateX(${
            xAngle
          }deg)`,
          width: "100%",
          height: `${deckMetrics.height + 20}px`,
          opacity: hiding ? 1 : 0,
        };
        covers.push(<CoverDiv style={coverStyle} />);
      }

      let metricIndex = 0;
      let numCards = 0;
      for (let i = 0; i < deck.cards.length; i++) {
        const card = deck.cards[i];
        if (!card) {
          continue;
        }
        numCards++;
        const cardStyle: React.CSSProperties = {
          transform: `translate3d(${deckMetrics.offset.x +
            deckMetrics.increment.x * metricIndex}px, ${
            deckMetrics.offset.y
          }px, ${metricIndex * 0.2}px) rotateX(${xAngle}deg)`,
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

        let draggable: IDraggable;
        if (ourTurn && controls.awaitingInput) {
          draggable = {
            index: i,
            player: color,
          };
        }
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

      if (numCards === 0 && ourTurn && controls.awaitingInput) {
        const passStyle: React.CSSProperties = {
          transform: `translate(${deckMetrics.offset.x}px, ${
            deckMetrics.offset.y
          }px)`,
        };
        passes.push(
          <PassDiv style={passStyle} onClick={this.onPass}>
            Pass
          </PassDiv>,
        );
        deckMetrics.offset.y;
      }
    }

    const { deals } = game.dealPile;
    const dpo = metrics.dealPileOffset;
    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];
      const { card, color } = deal;

      const cardStyle: React.CSSProperties = {
        transform: `translate3d(${dpo.x}px, ${dpo.y}px, ${deals.length -
          i}px) rotateX(0deg)`,
      };
      cards[card.id] = (
        <Square key={card.id} style={cardStyle} card={card} color={color} />
      );
    }

    const { board } = game;
    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const x = metrics.playAreaOffset.x + col * metrics.playAreaIncrement.x;
        const y = metrics.playAreaOffset.y + row * metrics.playAreaIncrement.y;
        const cardStyle: React.CSSProperties = {
          transform: `translate(${x}px, ${y}px) rotateX(0deg)`,
        };
        slots.push(
          <Slot
            key={`slot-${col}-${row}`}
            style={cardStyle}
            dropTarget={{
              col,
              row,
            }}
          />,
        );

        const square = getSquare(board, col, row);
        if (square) {
          if (square.card) {
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

          if (litSquares.indexOf(square) !== -1) {
            highlights.push(
              <Highlight
                key={`highlight-${col}-${row}`}
                style={cardStyle}
                invalid={invalidDropTarget}
              />,
            );
          }
        }
      }
    }

    return (
      <WrapperDiv style={wrapperStyle}>
        {slots}
        {map(Object.keys(cards).sort(), key => cards[key])}
        {highlights}
        {passes}
        {covers}
        <ReactHint persist events />
      </WrapperDiv>
    );
  }

  onPass = () => {
    this.props.pass({});
  };
}

interface IProps {}

interface IDerivedProps {
  system: ISystemState;
  metrics: IMetricsState;
  game: IGameState;
  controls: IControlsState;

  pass: typeof actions.pass;
}

export default connect<IProps>(PlayArea, {
  state: (rs: IRootState) => ({
    system: rs.system,
    metrics: rs.metrics,
    game: rs.game,
    controls: rs.controls,
  }),
  actions: {
    pass: actions.pass,
  },
});
