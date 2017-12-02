import * as React from "react";
import Slot, { SlotSide } from "./slot";

import styled from "./styles";

const PlayAreaDiv = styled.div`
  border: 3px solid white;
  position: relative;
  width: 800px;
  height: 800px;
  padding: 20px;
`;

export default class PlayArea extends React.PureComponent<{}> {
  render() {
    const numCols = 5;
    const numRows = 3;
    const margin = 10;
    const children: JSX.Element[] = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = (margin + SlotSide) * col;
        const y = (margin + SlotSide) * row;
        const style: React.CSSProperties = {
          transform: `translate(${x}px, ${y}px)`,
        };
        children.push(<Slot key={`${col}-${row}`} style={style} />);
      }
    }

    return <PlayAreaDiv>{children}</PlayAreaDiv>;
  }
}
