import styled from "./styles";
import * as React from "react";
import { Color, Card, cardGraphics, playerColors } from "../types/index";

export const SquareSide = 100;

const SquareDiv = styled.div`
  border: 3px solid white;
  width: ${SquareSide}px;
  height: ${SquareSide}px;
  border-radius: 4px;
  background-color: black;
  background-size: cover;
  border-style: dashed;
`;

export default class Square extends React.PureComponent<IProps> {
  render() {
    let { color, card } = this.props;
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

    return <SquareDiv style={style} />;
  }
}

interface IProps {
  style?: React.CSSProperties;
  color?: Color;
  card?: Card;
}
