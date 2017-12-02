import styled from "./styles";
import * as React from "react";
import * as classNames from "classnames";
import { Color, Card, cardGraphics, playerColors } from "../types/index";
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
`;

class Square extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    let { color, card, draggable, dropTarget } = this.props;
    let style: React.CSSProperties = {
      ...this.props.style,
    };

    if (card > Card.None) {
      const bgName = cardGraphics[card];
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
    });

    return (
      <SquareDiv
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
  card?: Card;

  draggable?: {
    player: Color;
    index: number;
  };

  dropTarget?: {
    col: number;
    row: number;
  };
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
