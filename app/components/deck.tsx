import {
  IRootState,
  Color,
  IDeck,
  playerColors,
  deckSize,
  IDraggable,
} from "../types/index";
import * as React from "react";
import { connect } from "./connect";

import * as actions from "../actions";

import styled from "./styles";

import Square, { SquareSide } from "./square";

const margin = 4;
const CardsDiv = styled.div`
  width: ${margin * 2 + deckSize * (margin + SquareSide)}px;
  height: ${SquareSide + margin * 2}px;
  position: relative;
`;

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

  transition: all 0.2s;
`;

const PassDiv = styled.div`
  z-index: 10;
  padding: 8px;
  font-size: 32px;
  background: #232323;
  border: 4px solid white;
  border-radius: 4px;

  &:hover {
    cursor: pointer;
  }
`;

class Deck extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { draggable, turnPlayer, player, count, deck } = this.props;
    let bgColor = "#222";
    const ourTurn = turnPlayer == player;

    const deckStyle: React.CSSProperties = {};
    if (ourTurn) {
      bgColor = playerColors[player];
    } else {
      deckStyle.pointerEvents = "none";
    }
    deckStyle.backgroundColor = bgColor;

    let invisibleIndex = -1;
    if (draggable && draggable.player === player) {
      invisibleIndex = draggable.index;
    }

    const cardEls: JSX.Element[] = [];
    let totalCards = 0;

    for (let i = 0; i < deckSize; i++) {
      const card = deck.cards[i];
      const x = margin + i * (SquareSide + margin);

      const squareStyle: React.CSSProperties = {
        position: "absolute",
        transform: `translateX(${x}px)`,
        flexShrink: 0,
        transition: "transform 0.2s ease-in-out",
        backgroundColor: bgColor,
        opacity: 0.3,
      };

      cardEls.push(<Square style={squareStyle} key={`ghost-${i}`} />);
      if (card) {
        totalCards++;
      }

      if (card && ourTurn) {
        cardEls.push(
          <Square
            style={{
              ...squareStyle,
              opacity: i === invisibleIndex ? 0 : 1,
              zIndex: 10,
            }}
            rhAt={player === Color.Red ? "bottom" : "top"}
            key={card ? card.id : `${i}`}
            card={card}
            draggable={
              card
                ? {
                    index: i,
                    player,
                  }
                : null
            }
          />,
        );
      }
    }

    let canPass = ourTurn && totalCards == 0;
    return (
      <DeckDiv style={deckStyle}>
        <Filler />
        <CounterDiv>{count}</CounterDiv>
        <Spacer />
        {canPass ? <PassDiv onClick={this.onPass}>Pass</PassDiv> : null}
        <CardsDiv>{cardEls}</CardsDiv>
        <Filler />
      </DeckDiv>
    );
  }

  onPass = () => {
    this.props.pass({});
  };
}

interface IProps {
  player: Color;
}

interface IDerivedProps {
  deck: IDeck;
  count: number;
  draggable: IDraggable;
  turnPlayer: Color;

  pass: typeof actions.pass;
}

export default connect<IProps>(Deck, {
  state: (rs: IRootState, props: IProps) => ({
    deck: rs.game.decks[props.player],
    count: rs.game.counts[props.player],
    draggable: rs.controls.draggable,
    turnPlayer: rs.controls.turnPlayer,
  }),
  actions: {
    pass: actions.pass,
  },
});
