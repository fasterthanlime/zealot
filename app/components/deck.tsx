import { IRootState, Color, IDeck, playerColors } from "../types/index";
import * as React from "react";
import { connect } from "./connect";

import styled from "./styles";

import { map } from "underscore";
import Square, { SquareSide } from "./square";

const Filler = styled.div`
  height: 1px;
  flex-grow: 1;
`;

const Spacer = styled.div`
  height: 1px;
  flex-basis: 12px;
  flex-grow: 0;
  flex-shrink: 0;
`;

const DeckDiv = styled.div`
  margin: 40px;
  padding: 10px;
  background: #414141;
  width: 100%;
  text-align: center;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const scaleFactor = 0.8;

class Deck extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { player, count, deck } = this.props;
    const squareStyle: React.CSSProperties = {
      marginLeft: "4px",
      marginRight: "8px",
      width: `${SquareSide * scaleFactor}px`,
      height: `${SquareSide * scaleFactor}px`,
    };
    const deckStyle: React.CSSProperties = {
      backgroundColor: playerColors[player],
    };

    return (
      <DeckDiv style={deckStyle}>
        <Filler />
        Score: {count}
        <Spacer />
        {map(deck.cards, (card, i) => (
          <Square
            style={squareStyle}
            key={`${i}`}
            card={card}
            draggable={{
              index: i,
              player,
            }}
          />
        ))}
        <Filler />
      </DeckDiv>
    );
  }
}

interface IProps {
  player: Color;
  count: number;
}

interface IDerivedProps {
  deck: IDeck;
}

export default connect<IProps>(Deck, {
  state: (rs: IRootState, props: IProps) => ({
    deck: props.player === Color.Red ? rs.game.deckRed : rs.game.deckBlue,
    count: rs.game.counts[props.player],
  }),
});
