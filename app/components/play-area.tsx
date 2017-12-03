import * as React from "react";
import Deck from "./deck";
import Board from "./board";
import Draggerino from "./draggerino";

import styled from "./styles";
import { Color } from "../types/index";

const ReactHintFactory = require("react-hint");
const ReactHint = ReactHintFactory(React);

const PlayAreaDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export default class PlayArea extends React.PureComponent<{}> {
  render() {
    return (
      <PlayAreaDiv>
        <ReactHint events delay={100} />
        <Draggerino />
        <Deck player={Color.Red} />
        <Board />
        <Deck player={Color.Blue} />
      </PlayAreaDiv>
    );
  }
}
