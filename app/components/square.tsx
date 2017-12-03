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

export const SquareSide = 100;

const SquareDiv = styled.div`
  user-select: none;
  border: 3px solid white;
  width: ${SquareSide}px;
  height: ${SquareSide}px;
  border-radius: 4px;
  background-size: cover;
  border-style: dashed;
  opacity: 1;
  transition: background-color 0.4s;

  &.draggable {
    opacity: 0.7;

    &:hover {
      cursor: grab;
      opacity: 1;
    }
  }

  &.dropTarget {
    border-color: rgba(255, 255, 255, 0.2);

    &:hover {
      border-color: white;
    }
  }

  &.lit {
    animation: ${animations.lighting} 0.5s both;
  }

  &.exploding {
    animation: ${animations.exploding} 0.5s both;
  }
`;

class Square extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    let {
      color,
      card,
      draggable,
      dropTarget,
      lit,
      exploding,
      rhAt,
    } = this.props;
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
      style.borderStyle = "solid";
    }

    const className = classNames({
      draggable: !!draggable,
      dropTarget: !!dropTarget,
      lit: !!lit,
      exploding: !!exploding,
    });

    return (
      <SquareDiv
        data-rh={tipForCard(card)}
        data-rh-at={rhAt}
        className={className}
        onDragStart={this.onDragStart}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
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

  onMouseEnter = e => {
    const { dropTarget } = this.props;
    if (dropTarget) {
      this.props.enterSquare(dropTarget);
    }
  };

  onMouseLeave = e => {
    const { dropTarget } = this.props;
    if (dropTarget) {
      this.props.exitSquare({});
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

  dropTarget?: {
    col: number;
    row: number;
  };

  lit?: boolean;
  exploding?: boolean;
  rhAt?: string;
}

interface IDerivedProps {
  dragStart: typeof actions.dragStart;
  dragEnd: typeof actions.dragEnd;

  enterSquare: typeof actions.enterSquare;
  exitSquare: typeof actions.exitSquare;
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

    enterSquare: actions.enterSquare,
    exitSquare: actions.exitSquare,
  },
});
