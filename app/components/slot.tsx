import styled from "./styles";
import * as React from "react";

export const SlotSide = 80;

const SlotDiv = styled.div`
  position: absolute;
  border: 1px solid white;
  width: ${SlotSide}px;
  height: ${SlotSide}px;
  border-radius: 2px;
`;

export default class Slot extends React.PureComponent<IProps> {
  render() {
    const { style } = this.props;
    return <SlotDiv style={style} />;
  }
}

interface IProps {
  style: React.CSSProperties;
}
