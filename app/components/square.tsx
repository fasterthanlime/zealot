import styled from "./styles";
import * as React from "react";
import * as classNames from "classnames";
import { Color, cardGraphics, ICard, tipForCard, Suit } from "../types/index";
import { connect } from "./connect";

import * as actions from "../actions";

const squareFactor = 1.5;
export const SquareWidth = 90 * squareFactor;
export const SquareHeight = 110 * squareFactor;

const SquareDiv = styled.div`
  position: absolute;
  user-select: none;
  width: ${SquareWidth}px;
  height: ${SquareHeight}px;
  opacity: 1;
  transition: transform .9s;

  .turner {
    border: 1px solid #343434;
    border-radius: 4px;
    box-shadow: 0 0 1px solid #616161;
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.8s;
    transform-style: preserve-3d;

    transform: rotateY(0deg);
    &.Blue {
      transform: rotateY(180deg);
    }

    &.Peasant {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.Peasant]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.Peasant]
      }') }
    }
    &.Martyr {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.Martyr]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.Martyr]
      }') }
    }
    &.Monk {
      .front { background-image: url('${cardGraphics[Color.Red][Suit.Monk]}') }
      .back  { background-image: url('${cardGraphics[Color.Blue][Suit.Monk]}') }
    }
    &.MarksmanL {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.MarksmanL]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.MarksmanL]
      }') }
    }
    &.MarksmanR {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.MarksmanR]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.MarksmanR]
      }') }
    }
    &.Priest {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.Priest]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.Priest]
      }') }
    }
    &.Goblin {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.Goblin]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.Goblin]
      }') }
    }
    &.Necromancer {
      .front { background-image: url('${
        cardGraphics[Color.Red][Suit.Necromancer]
      }') }
      .back  { background-image: url('${
        cardGraphics[Color.Blue][Suit.Necromancer]
      }') }
    }
  }

  .front,
  .back {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    transform-style: preserve-3d;
    background-size: 100% auto;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    backface-visibility: hidden;
  }

  .back {
    transform: rotateY(180deg);
  }

  &.draggable {
    &:hover,
    &.dragged {
      .turner {
        cursor: grab;
        border-color: white;
      }
    }
  }

  &.onBoard {
    pointer-events: none;
  }
`;

class Square extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    let { style, card, draggable, dragged, onBoard } = this.props;

    const className = classNames({
      draggable: !!draggable,
      dragged: !!dragged,
      onBoard: !!onBoard,
    });

    let colorClass = Color[card.color];
    let suitClass = card ? Suit[card.suit] : "";
    let rhAt: string = null;
    if (card) {
      rhAt = card.color === Color.Red ? "bottom" : "top";
    }

    return (
      <SquareDiv
        data-rh={tipForCard(card)}
        data-rh-at={rhAt}
        className={className}
        onDragStart={this.onDragStart}
        onMouseDown={this.onMouseDown}
        style={style}
      >
        <div className={`turner ${suitClass} ${colorClass}`}>
          <div className="front" />
          <div className="back" />
        </div>
      </SquareDiv>
    );
  }

  onDragStart = e => {
    return false;
  };

  onMouseDown = e => {
    const { draggable } = this.props;
    if (draggable) {
      this.props.dragStart(draggable);
    }
  };
}

interface IProps {
  style?: React.CSSProperties;
  card?: ICard;

  draggable?: {
    player: Color;
    index: number;
  };

  dragged?: boolean;
  onBoard?: boolean;
}

interface IDerivedProps {
  dragStart: typeof actions.dragStart;
  dragEnd: typeof actions.dragEnd;
}

export enum SquareMode {
  Draggable = 1,
  DropTarget = 2,
  Other = 3,
}

export default connect<IProps>(Square, {
  actions: {
    dragStart: actions.dragStart,
    dragEnd: actions.dragEnd,
  },
});
