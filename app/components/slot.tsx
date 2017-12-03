import * as React from "react";
import * as classNames from "classnames";
import styled from "./styles";
import { IRootState, IControlsState } from "../types/index";
import { connect } from "./connect";
import * as actions from "../actions";
import { SquareWidth, SquareHeight } from "./square";

const SlotDiv = styled.div`
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: ${SquareWidth + 10}px;
  height: ${SquareHeight + 10}px;
  left: -5px;
  top: -5px;

  &.focused {
    background: rgba(214, 214, 214, 1);
    &.invalid {
      background: red;
    }
  }
`;

class Slot extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { style, controls, dropTarget } = this.props;

    let focused = false;
    let invalid = false;
    if (controls.dropTarget) {
      if (
        controls.dropTarget.col === dropTarget.col &&
        controls.dropTarget.row === dropTarget.row
      ) {
        focused = true;
        if (!controls.dropTarget.valid) {
          invalid = true;
        }
      }
    }
    const className = classNames({ focused, invalid });

    return (
      <SlotDiv
        className={className}
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
  style: React.CSSProperties;
  dropTarget: {
    col: number;
    row: number;
  };
}

interface IDerivedProps {
  controls: IControlsState;

  tryEnterSquare: typeof actions.tryEnterSquare;
  exitSquare: typeof actions.exitSquare;
}

export default connect<IProps>(Slot, {
  state: (rs: IRootState) => ({
    controls: rs.controls,
  }),
  actions: {
    tryEnterSquare: actions.tryEnterSquare,
    exitSquare: actions.exitSquare,
  },
});
