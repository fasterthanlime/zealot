import styled, { animations } from "./styles";
import * as React from "react";
import * as classNames from "classnames";
import { Color, cardGraphics, ICard, tipForCard, Suit } from "../types/index";
import { connect } from "./connect";

import * as actions from "../actions";

export const SquareWidth = 90;
export const SquareHeight = 110;

const SquareDiv = styled.div`
  position: absolute;
  user-select: none;
  width: ${SquareWidth}px;
  height: ${SquareHeight}px;
  opacity: 1;
  transition: transform 0.4s;

  .turner {
    border: 1px solid #343434;
    border-radius: 4px;
    box-shadow: 0 0 1px solid #616161;
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.4s;
    transform-style: preserve-3d;

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
    let { color, card, draggable, dragged, onBoard } = this.props;
    let style: React.CSSProperties = {
      ...this.props.style,
    };
    let frontStyle: React.CSSProperties = {};
    let backStyle: React.CSSProperties = {};

    if (card) {
      frontStyle.backgroundImage = `url(${cardGraphics[Color.Red][card.suit]})`;
      backStyle.backgroundImage = `url(${cardGraphics[Color.Blue][card.suit]})`;
    }

    let turnerStyle: React.CSSProperties = {};
    if (color === Color.Blue) {
      turnerStyle.transform = `rotateY(180deg)`;
    } else {
      turnerStyle.transform = `rotateY(0deg)`;
    }

    const className = classNames({
      draggable: !!draggable,
      dragged: !!dragged,
      onBoard: !!onBoard,
    });

    let suitClass = card ? Suit[card.suit] : "";

    return (
      <SquareDiv
        data-rh={tipForCard(card)}
        data-rh-at={color === Color.Red ? "bottom" : "top"}
        className={className}
        onDragStart={this.onDragStart}
        onMouseDown={this.onMouseDown}
        style={style}
      >
        <div className={`turner ${suitClass}`} style={turnerStyle}>
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
  color?: Color;
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
