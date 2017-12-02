import {
  IRootState,
  Color,
  IDeck,
  playerColors,
  deckSize,
} from "../types/index";
import * as React from "react";
import { connect } from "./connect";

import styled from "./styles";

import { map } from "underscore";
import Square, { SquareSide } from "./square";

const CounterDiv = styled.div`
  flex-basis: 50px;
  flex-grow: 0;
  flex-shrink: 0;
  text-align: center;
`;

const Filler = styled.div`
  height: 1px;
  flex-grow: 1;
`;

const Spacer = styled.div`
  height: 1px;
  flex-basis: 20px;
  flex-grow: 0;
  flex-shrink: 0;
`;

const DeckDiv = styled.div`
  margin: 40px;
  padding: 10px 20px;
  background: #414141;
  width: 100%;
  text-align: center;

  display: flex;
  flex-direction: row;
  align-items: center;

  font-size: 48px;
`;

const scaleFactor = 1;

class Deck extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { player, count, deck } = this.props;
    const squareStyle: React.CSSProperties = {
      marginLeft: "2px",
      marginRight: "2px",
      width: `${SquareSide * scaleFactor}px`,
      height: `${SquareSide * scaleFactor}px`,
      flexShrink: 0,
    };
    const deckStyle: React.CSSProperties = {
      backgroundColor: playerColors[player],
    };

    const ghosts: JSX.Element[] = [];
    for (let i = deck.cards.length; i < deckSize; i++) {
      ghosts.push(<Square style={squareStyle} key={`${i}`} />);
    }

    return (
      <DeckDiv style={deckStyle}>
        <Filler />
        <CounterDiv>{count}</CounterDiv>
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
        {ghosts}
        <Filler />
      </DeckDiv>
    );
  }
}

interface IProps {
  player: Color;
}

interface IDerivedProps {
  deck: IDeck;
  count: number;
}

export default connect<IProps>(Deck, {
  state: (rs: IRootState, props: IProps) => ({
    deck: rs.game.decks[props.player],
    count: rs.game.counts[props.player],
  }),
});
