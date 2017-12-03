import * as React from "react";
import { connect } from "./connect";
import { IRootState, IControlsState, IDecks } from "../types/index";
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
    const { decks, controls } = this.props;
    const { draggable, mouse } = controls;
    const style: React.CSSProperties = {
      left: `${mouse.x}px`,
      top: `${mouse.y}px`,
    };
    let square: JSX.Element | string = "";
    if (draggable) {
      const deck = decks[draggable.player];
      const card = deck.cards[draggable.index];
      const squareStyle: React.CSSProperties = {
        transform: "translate(-50%, -50%)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
      };
      square = (
        <Square color={draggable.player} card={card} style={squareStyle} />
      );
    }

    return (
      <DraggerinoDiv style={style}>{draggable ? square : null}</DraggerinoDiv>
    );
  }
}

interface IProps {}

interface IDerivedProps {
  controls: IControlsState;
  decks: IDecks;
}

export default connect<IProps>(Draggerino, {
  state: (rs: IRootState) => ({
    controls: rs.controls,
    decks: rs.game.decks,
  }),
});
