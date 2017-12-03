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
  border: 1px solid black;
  width: ${SquareWidth}px;
  height: ${SquareHeight}px;
  border-radius: 4px;
  background-size: 90% auto;
  background-position: 50% 50%;
  background-repeat: no-repeat;
  opacity: 1;
  transition: transform 0.32s;

  &.draggable {
    &:hover {
      cursor: grab;
      border-color: white;
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
    let { color, card, draggable, lit, exploding, onBoard, rhAt } = this.props;
    let style: React.CSSProperties = {
      ...this.props.style,
    };

    if (card) {
      const bgName = cardGraphics[card.suit];
      if (bgName) {
        style.backgroundImage = `url(${bgName})`;
      }

      if (color) {
        style.backgroundColor = playerColors[color];
      }
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
        data-rh-at={rhAt}
        className={className}
        onDragStart={this.onDragStart}
        onMouseDown={this.onMouseDown}
        style={style}
      />
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
  rhAt?: string;
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
