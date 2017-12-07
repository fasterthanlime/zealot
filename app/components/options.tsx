import * as React from "react";
import { connect } from "./connect";
import {
  IRootState,
  IAIState,
  difficultyLevels,
  ISettingsState,
} from "../types/index";

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
  border-bottom: 1px solid #373737;
`;

class Options extends React.PureComponent<IProps & IDerivedProps> {
  render(): JSX.Element {
    let className = "";
    const { ai, settings } = this.props;
    if (!ai.optionsOpen) {
      className = "hidden";
    }

    return (
      <OptionsDiv className={className}>
        <Course>
          <p>
            Cards are played by dragging them from your deck (the bottom one) to
            the board.
          </p>
          <p>
            <strong>It's normal to lose</strong> - things will get clearer after
            you play a few games!
          </p>
          <p>
            Whoever has the <strong>least amount of cards</strong> on the board
            at the end of the game wins.
          </p>
        </Course>
        <Course>
          <h2>Options</h2>
          <div>
            Difficulty: {this.renderSelect(settings.level, difficultyLevels)}
          </div>
          <div style={{ margin: "1em 0" }}>
            <label>
              <input
                type="checkbox"
                checked={settings.musicEnabled}
                onChange={this.onMusicChange}
              />{" "}
              Enable music
            </label>
          </div>
          <Buttons>
            <Button className="small" onClick={this.onReset}>
              Reset game
            </Button>
            <Button className="large" onClick={this.onPlay}>
              Play Zealot
            </Button>
          </Buttons>
        </Course>
        <p>
          Zealot was made for{" "}
          <a
            href="https://ldjam.com/events/ludum-dare/40/zealot"
            target="_blank"
          >
            Ludum Dare 40
          </a>{" "}
          by <abbr title="game design, music & programming">Amos Wenger</abbr>
          <a target="_blank" href="https://twitter.com/fasterthanlime">
            <span className="icon icon-feather" />
          </a>
          <a target="_blank" href="https://fasterthanlime.itch.io/">
            <span className="icon icon-stars" />
          </a>{" "}
          and <abbr title="card art & play testing">Corinne Fenoglio</abbr>
          <a target="_blank" href="https://twitter.com/nalhue_">
            <span className="icon icon-feather" />
          </a>
          <a target="_blank" href="https://www.instagram.com/nalhue_art/">
            <span className="icon icon-stars" />
          </a>
        </p>
      </OptionsDiv>
    );
  }

  onReset = () => {
    if (window.confirm("Are you sure you want to reset the game?")) {
      window.location.reload();
    }
  };

  onMusicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.props.updateSettings({
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
        <option key={value[0]} value={value[0]}>
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
    this.props.updateSettings({
      level: parseInt(ev.currentTarget.value, 10),
    });
  };
}

interface IProps {}

interface IDerivedProps {
  ai: IAIState;
  settings: ISettingsState;

  updateAi: typeof actions.updateAi;
  updateSettings: typeof actions.updateSettings;
}

export default connect<IProps>(Options, {
  state: (rs: IRootState) => ({
    ai: rs.ai,
    settings: rs.settings,
  }),
  actions: {
    updateAi: actions.updateAi,
    updateSettings: actions.updateSettings,
  },
});
