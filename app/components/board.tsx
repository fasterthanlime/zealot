import Square, { SquareSide } from "./square";
import * as React from "react";

import styled from "./styles";
import { getSquare, IRootState, IBoard } from "../types/index";
import { connect } from "./connect";
const margin = 10;

const BoardDiv = styled.div`
  position: relative;
`;

class Board extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { board } = this.props;

    const { numCols, numRows } = board;
    const children: JSX.Element[] = [];
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const square = getSquare(board, col, row);
        if (square) {
          const x = margin + (margin + SquareSide) * col;
          const y = margin + (margin + SquareSide) * row;
          const style: React.CSSProperties = {
            position: "absolute",
            transform: `translate(${x}px, ${y}px)`,
          };
          children.push(
            <Square
              dropTarget={{
                col,
                row,
              }}
              key={`${col}-${row}`}
              style={style}
              color={square.color}
              card={square.card}
            />,
          );
        }
      }
    }

    const boardWidth = numCols * (margin + SquareSide) + margin;
    const boardHeight = numRows * (margin + SquareSide) + margin;
    const boardStyle = {
      width: boardWidth,
      height: boardHeight,
    };
    return <BoardDiv style={boardStyle}>{children}</BoardDiv>;
  }
}

interface IProps {}

interface IDerivedProps {
  board: IBoard;
}

export default connect<IProps>(Board, {
  state: (rs: IRootState) => ({
    board: rs.game.board,
  }),
});
