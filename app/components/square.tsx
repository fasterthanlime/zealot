import styled, { animations } from "./styles";
import * as React from "react";
import * as classNames from "classnames";
import {
  Color,
  cardGraphics,
  playerColors,
  ICard,
  tipForCard,
} from "../types/index";
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
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }

  .front,
  .back {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    transform-style: preserve-3d;
    background-size: 90% auto;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    backface-visibility: hidden;
  }

  .front {
    background-color: ${playerColors[Color.Red]};
  }

  .back {
    background-color: ${playerColors[Color.Blue]};
    transform: rotateY(180deg);
  }

  &.draggable {
    &:hover {
      .turner {
        cursor: grab;
        border-color: white;
      }
    }
  }

  &.lit {
    animation: ${animations.lighting} 0.5s both;
  }

  &.exploding {
    animation: ${animations.exploding} 0.5s both;
  }

  &.onBoard {
    pointer-events: none;
  }
`;

class Square extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    let { color, card, draggable, lit, exploding, onBoard } = this.props;
    let style: React.CSSProperties = {
      ...this.props.style,
    };
    let faceStyle: React.CSSProperties = {};

    if (card) {
      const bgName = cardGraphics[card.suit];
      if (bgName) {
        faceStyle.backgroundImage = `url(${bgName})`;
      }
    }

    let turnerStyle: React.CSSProperties = {};
    if (color === Color.Blue) {
      turnerStyle.transform = `rotateY(180deg)`;
    } else {
      turnerStyle.transform = `rotateY(0deg)`;
    }

    const className = classNames({
      draggable: !!draggable,
      lit: !!lit,
      exploding: !!exploding,
      onBoard: !!onBoard,
    });

    return (
      <SquareDiv
        data-rh={tipForCard(card)}
        data-rh-at={color === Color.Red ? "bottom" : "top"}
        className={className}
        onDragStart={this.onDragStart}
        onMouseDown={this.onMouseDown}
        style={style}
      >
        <div className="turner" style={turnerStyle}>
          <div className="front" style={faceStyle} />
          <div className="back" style={faceStyle} />
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

  lit?: boolean;
  exploding?: boolean;
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
