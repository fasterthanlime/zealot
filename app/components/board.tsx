import Square, { SquareSide } from "./square";
import * as React from "react";

import styled, { animations } from "./styles";
import { getSquare, IRootState, IBoard } from "../types/index";
import { connect } from "./connect";
import * as classNames from "classnames";
const margin = 10;

const BoardDiv = styled.div`
  position: relative;
`;

const SquareContainer = styled.div`
  &.vibrating {
    animation: ${animations.shake} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97)
      both;
  }
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
          const className = classNames({
            vibrating: !!square.vibrating,
          });

          children.push(
            <SquareContainer className={className}>
              <Square
                dropTarget={{
                  col,
                  row,
                }}
                key={`${col}-${row}`}
                style={style}
                color={square.color}
                card={square.card}
              />
            </SquareContainer>,
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
