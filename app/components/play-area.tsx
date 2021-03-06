import * as React from "react";

import styled, { animations } from "./styles";
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
  IAIState,
  playerColors,
  Suit,
  AreaType,
  aiColor,
} from "../types/index";
import { connect } from "./connect";

import { map } from "underscore";

import Square from "./square";
import Slot from "./slot";
import Highlight from "./highlight";
import * as actions from "../actions";

import UI from "./ui";
import { Button } from "./button";

const RootDiv = styled.div`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
`;

const WrapperDiv = styled.div`
  position: absolute;
  transform-style: preserve-3d;

  &.no-events {
    pointer-events: none;
  }
`;

const PassDivInner = styled.div`
  animation: 1s ${animations.beating} infinite;
  text-align: center;
`;

const PassDiv = styled.div`
  position: absolute;
  font-size: 22px;
  padding: 12px;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  right: 10px;
  top: 50%;

  transform: translate(0, -50%);

  z-index: 1000;
`;

const CoverDiv = styled.div`
  position: absolute;
  background: rgba(12, 12, 12, 0.4);
  transition: transform 0.32s, opacity 0.32s;
`;

export const globalMouse = {
  clientX: 0,
  clientY: 0,
};

document.addEventListener("mousemove", e => {
  globalMouse.clientX = e.clientX;
  globalMouse.clientY = e.clientY;
});

const allColors = [Color.Red, Color.Blue];

class PlayArea extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { system, metrics, game } = this.props;
    const { board } = game;
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
    let litSquares: any = {};
    let invalidDropTarget = false;
    if (controls.draggable) {
      const { draggable } = controls;
      draggedCard = game.decks[draggable.player][draggable.index];

      const cdt = controls.dropTarget;
      if (cdt) {
        let at = cdt.areaType;
        if (
          draggedCard.suit === Suit.Goblin ||
          draggedCard.suit === Suit.Priest
        ) {
          // show the full area
        } else {
          // just highlight a single square
          at = AreaType.Single;
        }

        invalidDropTarget = !cdt.valid;
        forEachAreaSquare(
          game.board,
          cdt.col,
          cdt.row,
          at,
          (col, row, card) => {
            litSquares[row * board.numCols + col] = true;
          },
        );
      }
    }

    for (const color of allColors) {
      const ourTurn = color === controls.turnPlayer;
      const canPlay = ourTurn && color !== aiColor;
      const deck = game.decks[color];
      const deckMetrics = metrics.decks[color];

      {
        let hiding = !(ourTurn && controls.awaitingInput);
        let z = -180;
        if (hiding) {
          z = 180;
        }
        const x = 0;
        const y = deckMetrics.offset.y;
        const coverStyle: React.CSSProperties = {
          transform: `translate3d(${x}px, ${y - 10}px, ${z}px)`,
          width: "100%",
          height: `${deckMetrics.height + 20}px`,
          opacity: hiding ? 0.4 : 0,
          backgroundColor: playerColors[color],
        };
        covers.push(<CoverDiv key={`cover-${color}`} style={coverStyle} />);
      }

      let metricIndex = 0;
      for (let i = 0; i < deck.length; i++) {
        const card = deck[i];
        if (!card) {
          continue;
        }
        let x = deckMetrics.offset.x + deckMetrics.increment.x * metricIndex;
        let y = deckMetrics.offset.y;
        let zIndex = metricIndex;

        metricIndex++;

        let dragged = false;
        if (draggedCard && draggedCard.id === card.id) {
          dragged = true;
        }

        let draggable: IDraggable;
        if (canPlay && controls.awaitingInput) {
          draggable = {
            index: i,
            player: color,
          };
        }
        cards[card.id] = (
          <Square
            key={card.id}
            x={x}
            y={y}
            zIndex={zIndex}
            card={card}
            draggable={draggable}
            dragged={dragged}
          />
        );
      }

      if (canPlay && controls.awaitingInput && controls.canPass) {
        passes.push(
          <PassDiv key={`pass-${color}`}>
            <p>You have no legal moves available!</p>
            <PassDivInner>
              <Button onClick={this.onPass}>Pass turn</Button>
            </PassDivInner>
          </PassDiv>,
        );
      }
    }

    const { dealPile } = game;
    const dpo = metrics.dealPileOffset;
    for (let i = 0; i < dealPile.length; i++) {
      const card = dealPile[i];

      let x = dpo.x;
      let y = dpo.y;
      let zIndex = dealPile.length - i;
      cards[card.id] = (
        <Square key={card.id} x={x} y={y} zIndex={zIndex} card={card} />
      );
    }

    const { trashPile } = game;
    const tpo = metrics.trashPileOffset;
    for (let i = 0; i < trashPile.length; i++) {
      const card = trashPile[i];

      let x = tpo.x;
      let y = tpo.y;
      let zIndex = trashPile.length - i;
      cards[card.id] = (
        <Square key={card.id} x={x} y={y} zIndex={zIndex} card={card} />
      );
    }

    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const x = metrics.playAreaOffset.x + col * metrics.playAreaIncrement.x;
        const y = metrics.playAreaOffset.y + row * metrics.playAreaIncrement.y;
        const zIndex = 0;
        slots.push(
          <Slot
            key={`slot-${col}-${row}`}
            x={x}
            y={y}
            zIndex={zIndex}
            dropTarget={{
              col,
              row,
            }}
          />,
        );

        const bcard = getSquare(board, col, row);
        if (bcard) {
          cards[bcard.id] = (
            <Square
              key={bcard.id}
              x={x}
              y={y}
              zIndex={zIndex}
              card={bcard}
              onBoard
            />
          );
        }

        let index = col + row * board.numCols;
        if (litSquares[index]) {
          highlights.push(
            <Highlight
              x={x}
              y={y}
              zIndex={zIndex}
              key={`highlight-${index}`}
              invalid={invalidDropTarget}
            />,
          );
        }
      }
    }

    return (
      <RootDiv>
        <WrapperDiv style={wrapperStyle}>
          {slots}
          {map(Object.keys(cards).sort(), key => cards[key])}
          {highlights}
          {passes}
          {covers}
        </WrapperDiv>
        <UI />
      </RootDiv>
    );
  }

  onPass = () => {
    this.props.playCard(null);
  };
}

interface IProps {}

interface IDerivedProps {
  system: ISystemState;
  metrics: IMetricsState;
  game: IGameState;
  controls: IControlsState;
  ai: IAIState;

  playCard: typeof actions.playCard;
  updateAi: typeof actions.updateAi;
}

export default connect<IProps>(PlayArea, {
  state: (rs: IRootState) => ({
    system: rs.system,
    metrics: rs.metrics,
    game: rs.game,
    controls: rs.controls,
    ai: rs.ai,
  }),
  actions: {
    playCard: actions.playCard,
    updateAi: actions.updateAi,
  },
});
