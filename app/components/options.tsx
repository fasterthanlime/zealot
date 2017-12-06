import * as React from "react";
import { connect } from "./connect";
import { IRootState, IAIState, difficultyLevels } from "../types/index";

import * as actions from "../actions";
import styled from "./styles";
import { Buttons, Button } from "./button";
import { aiLevelFactor } from "../util/rules";

const OptionsDiv = styled.div`
  pointer-events: initial;

  position: absolute;
  padding: 20px 10px;

  width: 80%;
  max-width: 800px;
  overflow-y: auto;
  max-height: 90%;

  top: 50%;
  left: 50%;

  opacity: 1;
  transition: transform 0.4s, opacity 0.4s;
  transform: translate3d(-50%, -50%, 200px);

  font-size: 15px;
  line-height: 1.4;

  &.hidden {
    transform: translate3d(-50%, -50%, -200px);
    opacity: 0;
    pointer-events: none;
  }

  background: #121212;
  box-shadow: 0 0 40px #121212;

  a {
    &,
    &:visited {
      color: #e766ff;
      text-decoration: none;

      .icon {
        margin-left: 8px;
      }
    }

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Course = styled.div`
  column-count: 2;
  border-bottom: 1px solid white;
`;

class Options extends React.PureComponent<IProps & IDerivedProps> {
  render(): JSX.Element {
    let className = "";
    const { ai } = this.props;
    if (!ai.optionsOpen) {
      className = "hidden";
    }

    return (
      <OptionsDiv className={className}>
        <h1>Zealot</h1>
        <Course>
          <p>
            Whoever has the least amount of cards on the board at the end of the
            game wins. You can get rid of cards by destroying them (Goblin
            card), converting them (Priest card), or playing another card over
            them.
          </p>
          <p>
            Cards are played by dragging them from your deck (the blue one at
            the bottom) to the board. If the move is illegal, the square will be
            highlighted in red. If your move might affect several squares, all
            the affected will be highlighted in white.
          </p>
          <p>
            Goblin and Priest cards have a different area of effect depending on
            which card they're played. A Goblin played on a Marksman can wipe
            out a whole row! A Priest on a well-placed Monk can be devastating.
          </p>
          <p>
            Civilian cards like peasants and monks can only be placed on empty
            squares. However, Marksman cards, while they don't have an immediate
            effect, can be placed over any other card.
          </p>
          <p>
            Good luck! And don't forget to turn up the difficulty level if it's
            too easy for you!
          </p>
        </Course>
        <h2>Options</h2>
        <div>
          Difficulty level: {this.renderSelect(ai.level, difficultyLevels)}
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={ai.musicEnabled}
              onChange={this.onMusicChange}
            />{" "}
            Enable music
          </label>
        </div>
        <h2>Credits</h2>
        <ul>
          <li>
            Amos Wenger (game design & programming)
            <a target="_blank" href="https://twitter.com/fasterthanlime">
              <span className="icon icon-feather" />
            </a>
            <a target="_blank" href="https://fasterthanlime.itch.io/">
              <span className="icon icon-stars" />
            </a>
          </li>
          <li>
            Corinne Fenoglio (card artwork & play-testing)
            <a target="_blank" href="https://twitter.com/nalhue_">
              <span className="icon icon-feather" />
            </a>
            <a target="_blank" href="https://www.instagram.com/nalhue_art/">
              <span className="icon icon-stars" />
            </a>
          </li>
        </ul>
        <p>
          Made with love for{" "}
          <a
            href="https://ldjam.com/events/ludum-dare/40/zealot"
            target="_blank"
          >
            Ludum Dare #40
          </a>
        </p>
        <Buttons>
          <Button className="small" onClick={this.onReset}>
            Reset game
          </Button>
          <Button className="large" onClick={this.onPlay}>
            Play
          </Button>
        </Buttons>
      </OptionsDiv>
    );
  }

  onReset = () => {
    if (window.confirm("Are you sure you want to reset the game?")) {
      window.location.reload();
    }
  };

  onMusicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.props.updateAi({
      musicEnabled: ev.currentTarget.checked,
    });
  };

  onPlay = () => {
    this.props.updateAi({
      optionsOpen: false,
    });
  };

  renderSelect(selectedValue: number, values: any[]): JSX.Element {
    const options: JSX.Element[] = [];
    for (const value of values) {
      options.push(
        <option value={value[0]}>
          {value[1]} {" — "}
          {value[0] * aiLevelFactor}s AI rounds
        </option>,
      );
    }

    return (
      <select value={selectedValue} onChange={this.onSelectChange}>
        {options}
      </select>
    );
  }

  onSelectChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.updateAi({
      level: parseInt(ev.currentTarget.value, 10),
    });
  };
}

interface IProps {}

interface IDerivedProps {
  ai: IAIState;

  updateAi: typeof actions.updateAi;
}

export default connect<IProps>(Options, {
  state: (rs: IRootState) => ({
    ai: rs.ai,
  }),
  actions: {
    updateAi: actions.updateAi,
  },
});
