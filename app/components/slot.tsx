import * as React from "react";
import styled from "./styles";
import { connect } from "./connect";
import * as actions from "../actions";
import { SquareWidth, SquareHeight } from "./square";

const SlotDiv = styled.div`
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: ${SquareWidth}px;
  height: ${SquareHeight}px;
  border-radius: 8px;
`;

class Slot extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { x, y, zIndex } = this.props;
    const style: React.CSSProperties = {
      transform: `translate(${x}px, ${y}px)`,
      zIndex,
    };

    return (
      <SlotDiv
        style={style}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      />
    );
  }

  onMouseEnter = e => {
    const { dropTarget } = this.props;
    if (dropTarget) {
      this.props.tryEnterSquare(dropTarget);
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
  x: number;
  y: number;
  zIndex: number;

  dropTarget: {
    col: number;
    row: number;
  };
}

interface IDerivedProps {
  tryEnterSquare: typeof actions.tryEnterSquare;
  exitSquare: typeof actions.exitSquare;
}

export default connect<IProps>(Slot, {
  actions: {
    tryEnterSquare: actions.tryEnterSquare,
    exitSquare: actions.exitSquare,
  },
});
