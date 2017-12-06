import * as React from "react";
import * as classNames from "classnames";
import styled from "./styles";
import { SquareWidth, SquareHeight } from "./square";

const HighlightDiv = styled.div`
  position: absolute;
  background: white;
  opacity: 0.4;
  width: ${SquareWidth}px;
  height: ${SquareHeight}px;
  border-radius: 8px;

  pointer-events: none;

  &.invalid {
    background: red;
  }
`;

export default class Highlight extends React.PureComponent<IProps> {
  render() {
    const { x, y, zIndex, invalid } = this.props;
    const className = classNames({ invalid });

    const style: React.CSSProperties = {
      transform: `translate(${x}px, ${y}px)`,
      zIndex,
    };
    return <HighlightDiv className={className} style={style} />;
  }
}

interface IProps {
  invalid: boolean;

  x: number;
  y: number;
  zIndex: number;
}
