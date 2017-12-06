import * as React from "react";
import * as actions from "../actions";

const ReactHintFactory = require("react-hint");
const ReactHint = ReactHintFactory(React);

const inDev = location.hostname === "localhost";

import styled, { animations } from "./styles";
import {
  playerColors,
  Color,
  difficultyLevels,
  IAIState,
  IRootState,
  IControlsState,
  IScoreState,
  swapColor,
  aiColor,
} from "../types/index";
import { connect } from "./connect";

import Options from "./options";
import { Buttons, Button } from "./button";
import { Outcome } from "../util/rules";

const WrapperDiv = styled.div`
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const ScoreBoard = styled.div`
  border: inset 1px solid rgba(255, 255, 255, 0.4);
  background: #212121;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 0.7em;

  padding: 4px 12px;

  &.red {
    background: ${playerColors[Color.Red]};
  }

  &.blue {
    background: ${playerColors[Color.Blue]};
  }
`;

const AIInfo = styled.div`
  font-size: 16px;
  line-height: 1.4;
  padding: 6px 12px;
  position: fixed;
  top: 50%;
  left: 0;
  color: white;

  pointer-events: initial;

  transition: transform 0.4s, opacity 0.4s;
  transform: translate3d(0, -50%, 0);
  opacity: 1;

  &.hidden {
    transform: translate3d(-50%, -50%, 0);
    opacity: 0;
  }
`;

const OutcomeInfo = styled.div`
  font-size: 24px;
  line-height: 1.4;
  padding: 12px 24px;
  position: fixed;
  top: 50%;
  left: 50%;
  min-width: 50%;
  min-height: 50%;

  box-shadow: 0 0 40px black;
  background: black;
  color: white;
  opacity: 0.7;

  pointer-events: initial;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  transform: translate3d(-50%, -50%, 0);
`;

const Separator = styled.div`
  width: 2px;
  margin: 0 8px;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  display: inline-block;
`;

const SpinnerContainer = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  font-size: 80px;
  pointer-events: none;
  color: white;
  transform: translate3d(-50%, 0, 80px);
`;

const Spinner = styled.div`
  width: 1em;
  height: 1em;
  border: 3px solid white;
  border-radius: 50%;
  animation: 1s ${animations.beating} infinite;
  display: inline-block;
  margin-right: 4px;
  background: #171217;
`;

class UI extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { ai, score, controls } = this.props;
    let aiInfoClass = "";
    if (ai.optionsOpen) {
      aiInfoClass = "hidden";
    }

    const firstRound = controls.outcome === Outcome.Neutral;

    let canLastMove = false;
    if (!controls.hasActiveGame) {
      canLastMove = !!controls.lastMove;
    } else {
      // in an active game, we can only show last move when it's
      // our turn to play
      const ourTurn = controls.turnPlayer === swapColor(aiColor);
      canLastMove = !!controls.lastMove && ourTurn && controls.awaitingInput;
    }

    return (
      <WrapperDiv>
        <ReactHint persist events />
        {controls.showOutcome ? (
          <OutcomeInfo>
            {firstRound ? (
              <p>Ready when you are!</p>
            ) : (
              <p>{formatOutcome(controls.outcome)}</p>
            )}

            <Buttons>
              {controls.lastMove ? (
                <Button onClick={this.onReplay}>Show last move</Button>
              ) : null}

              <Button onClick={this.onNewGame}>
                {firstRound ? "New game" : "Play again"}
              </Button>
            </Buttons>
          </OutcomeInfo>
        ) : null}
        <AIInfo className={aiInfoClass}>
          <div style={{ fontSize: "120%", textAlign: "center" }}>
            <ScoreBoard className="red">{score.losses}</ScoreBoard>
            <Separator />
            <ScoreBoard>{score.draws}</ScoreBoard>
            <Separator />
            <ScoreBoard className="blue">{score.wins}</ScoreBoard>
          </div>
          {inDev ? (
            <div>
              {ai.itersPerSec}
              <br />AI chance: {(ai.winChance * 100).toFixed()}%
            </div>
          ) : null}
          {formatDifficulty(ai.level)}
          <Buttons>
            <Button className="small" onClick={this.onOptions}>
              Options
            </Button>
          </Buttons>
          {
            <Buttons className={canLastMove ? "shown" : "hidden"}>
              <Button className="small" onClick={this.onReplay}>
                Show last move
              </Button>
            </Buttons>
          }
        </AIInfo>
        {ai.thinking ? (
          <SpinnerContainer>
            <Spinner />
          </SpinnerContainer>
        ) : null}
        <Options />
      </WrapperDiv>
    );
  }

  onOptions = () => {
    this.props.updateAi({
      optionsOpen: true,
    });
  };

  onReplay = () => {
    this.props.replay({});
  };

  onNewGame = () => {
    this.props.newGame({});
  };
}

function formatDifficulty(value: number): string {
  for (const lv of difficultyLevels) {
    if (lv[0] === value) {
      return lv[1] as string;
    }
  }
  return "?";
}

function formatOutcome(outcome: Outcome): string {
  switch (outcome) {
    case Outcome.Win:
      return "You won!";
    case Outcome.Loss:
      return "You lost! But there's always next time :)";
    case Outcome.Draw:
      return "It's a draw!";
    default:
      return null;
  }
}

interface IProps {}

interface IDerivedProps {
  ai: IAIState;
  score: IScoreState;
  controls: IControlsState;

  updateAi: typeof actions.updateAi;
  newGame: typeof actions.newGame;
  replay: typeof actions.replay;
}

export default connect<IProps>(UI, {
  state: (rs: IRootState) => ({
    ai: rs.ai,
    score: rs.score,
    controls: rs.controls,
  }),
  actions: {
    updateAi: actions.updateAi,
    newGame: actions.newGame,
    replay: actions.replay,
  },
});
