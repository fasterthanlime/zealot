import * as React from "react";
import { connect } from "./connect";
import { IRootState, IControlsState, IDeck, Color } from "../types/index";
import Square from "./square";

import styled from "./styles";

const DraggerinoDiv = styled.div`
  position: fixed;
  z-index: 100;
  border-radius: 50%;
  pointer-events: none;
`;

class Draggerino extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { deckRed, deckBlue, controls } = this.props;
    const { draggable, mouse } = controls;
    const style: React.CSSProperties = {
      left: `${mouse.x}px`,
      top: `${mouse.y}px`,
    };
    let square: JSX.Element | string = "";
    if (draggable) {
      const deck = draggable.player === Color.Red ? deckRed : deckBlue;
      const card = deck.cards[draggable.index];
      const squareStyle: React.CSSProperties = {
        transform: "translate(-50%, -50%)",
      };
      square = (
        <Square color={draggable.player} card={card} style={squareStyle} />
      );
    }

    return (
      <DraggerinoDiv style={style}>
        {draggable ? square : "not dragging"}
      </DraggerinoDiv>
    );
  }
}

interface IProps {}

interface IDerivedProps {
  controls: IControlsState;
  deckRed: IDeck;
  deckBlue: IDeck;
}

export default connect<IProps>(Draggerino, {
  state: (rs: IRootState) => ({
    controls: rs.controls,
    deckRed: rs.game.deckRed,
    deckBlue: rs.game.deckBlue,
  }),
});
