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

const AIInfo = styled.div`
  font-size: 16px;
  line-height: 1.4;
  padding: 12px;
  position: fixed;
  top: 40px;
  right: 80px;
  pointer-events: none;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  transform: translate3d(0, 0, 40px);
`;

const Spinner = styled.div`
  width: 1em;
  height: 1em;
  border: 3px solid white;
  border-radius: 50%;
  animation: 1s ${animations.beating} infinite;
  display: inline-block;
  margin-right: 4px;
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

export const globalMouse = {
  clientX: 0,
  clientY: 0,
};

document.addEventListener("mousemove", e => {
  globalMouse.clientX = e.clientX;
  globalMouse.clientY = e.clientY;
});

class PlayArea extends React.Component<IProps & IDerivedProps, IState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      clientX: 0,
      clientY: 0,
    };
  }

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
        invalidDropTarget = !cdt.valid;
        forEachAreaSquare(
          game.board,
          cdt.col,
          cdt.row,
          cdt.areaType,
          (col, row, card) => {
            litSquares[row * board.numCols + col] = true;
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
        covers.push(<CoverDiv key={`cover-${color}`} style={coverStyle} />);
      }

      let metricIndex = 0;
      let numCards = 0;
      for (let i = 0; i < deck.length; i++) {
        const card = deck[i];
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

        let dragged = false;
        if (draggedCard && draggedCard.id === card.id) {
          const { clientX, clientY } = this.state;
          const x = clientX - SquareWidth * 0.5;
          const y = clientY - SquareHeight * 0.5;
          cardStyle.transform = `translate3d(${x}px, ${
            y
          }px, 40px) rotateX(0deg)`;
          cardStyle.transition = "initial";
          cardStyle.pointerEvents = "none";
          dragged = true;
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
            dragged={dragged}
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

    const { dealPile } = game;
    const dpo = metrics.dealPileOffset;
    for (let i = 0; i < dealPile.length; i++) {
      const card = dealPile[i];

      const cardStyle: React.CSSProperties = {
        transform: `translate3d(${dpo.x}px, ${dpo.y}px, ${dealPile.length -
          i}px) rotateX(0deg)`,
      };
      cards[card.id] = <Square key={card.id} style={cardStyle} card={card} />;
    }

    const { trashPile } = game;
    const tpo = metrics.trashPileOffset;
    for (let i = 0; i < trashPile.length; i++) {
      const card = trashPile[i];

      const cardStyle: React.CSSProperties = {
        transform: `translate3d(${tpo.x}px, ${tpo.y}px, ${trashPile.length -
          i}px) rotateX(0deg)`,
      };
      cards[card.id] = <Square key={card.id} style={cardStyle} card={card} />;
    }

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

        const bcard = getSquare(board, col, row);
        if (bcard) {
          cards[bcard.id] = (
            <Square key={bcard.id} style={cardStyle} card={bcard} onBoard />
          );
        }

        // FIXME: better lookup
        let index = col + row * board.numCols;
        if (litSquares[index]) {
          highlights.push(
            <Highlight
              key={`highlight-${index}`}
              style={cardStyle}
              invalid={invalidDropTarget}
            />,
          );
        }
      }
    }

    const { ai } = this.props;

    return (
      <WrapperDiv style={wrapperStyle}>
        {slots}
        {map(Object.keys(cards).sort(), key => cards[key])}
        {highlights}
        {passes}
        {covers}
        <ReactHint persist events />
        <AIInfo>
          {ai.thinking ? (
            <span>
              <Spinner />Thinking...
            </span>
          ) : (
            "Idle"
          )}
          <br />
          {ai.itersPerSec}k iters/s
          <br />
          AI win chance: {(ai.winChance * 100).toFixed()}%
        </AIInfo>
      </WrapperDiv>
    );
  }

  onPass = () => {
    this.props.playCard(null);
  };

  componentWillReceiveProps(nextProps: IProps & IDerivedProps) {
    if (this.props.controls.draggable) {
      if (!nextProps.controls.draggable) {
        document.removeEventListener("mousemove", this.onMouseMove);
      }
    } else {
      if (nextProps.controls.draggable) {
        // TODO: set initial clientX/clientY
        document.addEventListener("mousemove", this.onMouseMove);
        this.setState({
          clientX: globalMouse.clientX,
          clientY: globalMouse.clientY,
        });
      }
    }
  }

  onMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    this.setState({
      clientX,
      clientY,
    });
  };
}

interface IState {
  clientX: number;
  clientY: number;
}

interface IProps {}

interface IDerivedProps {
  system: ISystemState;
  metrics: IMetricsState;
  game: IGameState;
  controls: IControlsState;
  ai: IAIState;

  playCard: typeof actions.playCard;
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
  },
});
