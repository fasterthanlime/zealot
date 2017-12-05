import * as React from "react";

import styled, { animations } from "./styles";
import {
  Color,
  ISystemState,
  IRootState,
  IMetricsState,
  IGameState,
  IDraggable,
  IControlsState,
  ICard,
  getSquare,
  forEachAreaSquare,
  IAIState,
  playerColors,
} from "../types/index";
import { connect } from "./connect";

import { map } from "underscore";

import Square, { SquareWidth, SquareHeight } from "./square";
import Slot from "./slot";
import Highlight from "./highlight";
import * as actions from "../actions";
import { aiLevelFactor } from "../util/rules";

const ReactHintFactory = require("react-hint");
const ReactHint = ReactHintFactory(React);

const inDev = location.hostname === "localhost";

const WrapperDiv = styled.div`
  position: relative;
  perspective: 600px;
  transform-style: preserve-3d;
`;

const AIInfo = styled.div`
  font-size: 16px;
  line-height: 1.4;
  padding: 12px;
  position: fixed;
  top: 40px;
  left: 80px;
  color: white;
  background: rgba(0, 0, 0, 0.7);

  transition: transform 0.4s, opacity 0.4s;
  transform: translate3d(0, 0, 40px);
  opacity: 1;

  &.hidden {
    transform: translate3d(0, 0, -40px);
    opacity: 0;
  }
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

const difficultyLevels = [
  [1, "Little baby"],
  [2, "Big baby"],
  [4, "Peasant"],
  [8, "Monk (recommended)"],
  [16, "Marksman"],
  [32, "Goblin"],
  [64, "Priest"],
  [128, "Necromancer"],
];

function formatDifficulty(value: number): string {
  for (const lv of difficultyLevels) {
    if (lv[0] === value) {
      return lv[1] as string;
    }
  }
  return "?";
}

const OptionsDiv = styled.div`
  user-select: initial;
  -moz-user-select: initial;
  -webkit-user-select: initial;
  -ms-user-select: initial;

  position: absolute;
  padding: 40px;

  width: 50%;
  height: 80%;

  top: 50%;
  left: 50%;

  transform: translate3d(-50%, -50%, 120px);
  opacity: 1;
  transition: transform 0.4s, opacity 0.4s;

  font-size: 15px;
  line-height: 1.4;

  &.hidden {
    transform: translate3d(-50%, -50%, -120px);
    opacity: 0;
    pointer-events: none;
  }

  image-rendering: optimizeSpeed; /* Legal fallback */
  image-rendering: -moz-crisp-edges; /* Firefox        */
  image-rendering: -o-crisp-edges; /* Opera          */
  image-rendering: -webkit-optimize-contrast; /* Safari         */
  image-rendering: optimize-contrast; /* CSS3 Proposed  */
  image-rendering: crisp-edges; /* CSS4 Proposed  */
  image-rendering: pixelated; /* CSS4 Proposed  */
  -ms-interpolation-mode: nearest-neighbor; /* IE8+           */

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

const Buttons = styled.div`
  text-align: center;
`;

const Button = styled.div`
  border: 2px solid white;
  border-radius: 2px;
  background: #232323;
  padding: 12px 40px;
  margin: 12px;

  &.large {
    font-size: 28px;
  }

  &:hover {
    cursor: pointer;
  }

  display: inline-block;
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

const PassDiv = styled.div`
  position: absolute;
  font-size: 28px;
  padding: 12px;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;

  &:hover {
    cursor: pointer;
    border-color: rgba(255, 255, 255, 0.9);
  }
`;

const CoverDiv = styled.div`
  position: absolute;
  background: rgba(12, 12, 12, 0.4);
  transition: transform 0.32s, opacity 0.32s;
`;

export const globalMouse = {
  clientX: 0,
  clientY: 0,
};

document.addEventListener("mousemove", e => {
  globalMouse.clientX = e.clientX;
  globalMouse.clientY = e.clientY;
});

class PlayArea extends React.Component<IProps & IDerivedProps, IState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      clientX: 0,
      clientY: 0,
    };
  }

  render() {
    const { system, metrics, game } = this.props;
    const { board } = game;
    if (!metrics.decks) {
      return <div>Loading...</div>;
    }

    const { clientWidth, clientHeight } = system;
    const wrapperStyle: React.CSSProperties = {
      width: `${clientWidth}px`,
      height: `${clientHeight}px`,
    };
    let cards: {
      [key: string]: JSX.Element;
    } = {};
    let passes: JSX.Element[] = [];
    let covers: JSX.Element[] = [];
    let slots: JSX.Element[] = [];
    let highlights: JSX.Element[] = [];

    let draggedCard: ICard = null;
    const { controls } = this.props;
    let litSquares: any = {};
    let invalidDropTarget = false;
    if (controls.draggable) {
      const { draggable } = controls;
      draggedCard = game.decks[draggable.player][draggable.index];

      const cdt = controls.dropTarget;
      if (cdt) {
        invalidDropTarget = !cdt.valid;
        forEachAreaSquare(
          game.board,
          cdt.col,
          cdt.row,
          cdt.areaType,
          (col, row, card) => {
            litSquares[row * board.numCols + col] = true;
          },
        );
      }
    }

    for (const color of [Color.Red, Color.Blue]) {
      const ourTurn = color === controls.turnPlayer;
      const deck = game.decks[color];
      const deckMetrics = metrics.decks[color];
      const xAngle = 6 * (color === Color.Red ? 1 : -1);

      {
        let hiding = !(ourTurn && controls.awaitingInput);
        let z = -4;
        if (hiding) {
          z = 4;
        }
        const x = 0;
        const y = deckMetrics.offset.y;
        const coverStyle: React.CSSProperties = {
          transform: `translate3d(${x}px, ${y - 10}px, ${z}px) rotateX(${
            xAngle
          }deg)`,
          width: "100%",
          height: `${deckMetrics.height + 20}px`,
          opacity: hiding ? 0.4 : 0,
          backgroundColor: playerColors[color],
        };
        covers.push(<CoverDiv key={`cover-${color}`} style={coverStyle} />);
      }

      let metricIndex = 0;
      let numCards = 0;
      for (let i = 0; i < deck.length; i++) {
        const card = deck[i];
        if (!card) {
          continue;
        }
        numCards++;
        const cardStyle: React.CSSProperties = {
          transform: `translate3d(${deckMetrics.offset.x +
            deckMetrics.increment.x * metricIndex}px, ${
            deckMetrics.offset.y
          }px, ${metricIndex * 0.2}px) rotateX(${xAngle}deg)`,
        };
        metricIndex++;

        let dragged = false;
        if (draggedCard && draggedCard.id === card.id) {
          const { clientX, clientY } = this.state;
          const x = clientX - SquareWidth * 0.5;
          const y = clientY - SquareHeight * 0.5;
          cardStyle.transform = `translate3d(${x}px, ${
            y
          }px, 40px) rotateX(0deg)`;
          cardStyle.transition = "initial";
          cardStyle.pointerEvents = "none";
          dragged = true;
        }

        let draggable: IDraggable;
        if (ourTurn && controls.awaitingInput) {
          draggable = {
            index: i,
            player: color,
          };
        }
        cards[card.id] = (
          <Square
            key={card.id}
            style={cardStyle}
            card={card}
            draggable={draggable}
            dragged={dragged}
          />
        );
      }

      if (numCards === 0 && ourTurn && controls.awaitingInput) {
        const passStyle: React.CSSProperties = {
          transform: `translate(${deckMetrics.offset.x}px, ${
            deckMetrics.offset.y
          }px)`,
        };
        passes.push(
          <PassDiv style={passStyle} onClick={this.onPass}>
            Pass
          </PassDiv>,
        );
        deckMetrics.offset.y;
      }
    }

    const { dealPile } = game;
    const dpo = metrics.dealPileOffset;
    for (let i = 0; i < dealPile.length; i++) {
      const card = dealPile[i];

      const cardStyle: React.CSSProperties = {
        transform: `translate3d(${dpo.x}px, ${dpo.y}px, ${dealPile.length -
          i}px) rotateX(0deg)`,
      };
      cards[card.id] = <Square key={card.id} style={cardStyle} card={card} />;
    }

    const { trashPile } = game;
    const tpo = metrics.trashPileOffset;
    for (let i = 0; i < trashPile.length; i++) {
      const card = trashPile[i];

      const cardStyle: React.CSSProperties = {
        transform: `translate3d(${tpo.x}px, ${tpo.y}px, ${trashPile.length -
          i}px) rotateX(0deg)`,
      };
      cards[card.id] = <Square key={card.id} style={cardStyle} card={card} />;
    }

    for (let col = 0; col < board.numCols; col++) {
      for (let row = 0; row < board.numRows; row++) {
        const x = metrics.playAreaOffset.x + col * metrics.playAreaIncrement.x;
        const y = metrics.playAreaOffset.y + row * metrics.playAreaIncrement.y;
        const cardStyle: React.CSSProperties = {
          transform: `translate(${x}px, ${y}px) rotateX(0deg)`,
        };
        slots.push(
          <Slot
            key={`slot-${col}-${row}`}
            style={cardStyle}
            dropTarget={{
              col,
              row,
            }}
          />,
        );

        const bcard = getSquare(board, col, row);
        if (bcard) {
          cards[bcard.id] = (
            <Square key={bcard.id} style={cardStyle} card={bcard} onBoard />
          );
        }

        // FIXME: better lookup
        let index = col + row * board.numCols;
        if (litSquares[index]) {
          highlights.push(
            <Highlight
              key={`highlight-${index}`}
              style={cardStyle}
              invalid={invalidDropTarget}
            />,
          );
        }
      }
    }

    const { ai } = this.props;
    let aiInfoClass = "";
    if (ai.optionsOpen) {
      aiInfoClass = "hidden";
    }

    return (
      <WrapperDiv style={wrapperStyle}>
        {slots}
        {map(Object.keys(cards).sort(), key => cards[key])}
        {highlights}
        {passes}
        {covers}
        <ReactHint persist events />
        <AIInfo className={aiInfoClass}>
          <div style={{ fontSize: "180%" }}>
            AI {ai.wins}
            {" · "}
            You {ai.losses}
            {" · "}
            Draws {ai.draws}
          </div>
          {inDev ? (
            <div>
              {ai.itersPerSec} AI win chance: {(ai.winChance * 100).toFixed()}%
            </div>
          ) : null}
          Difficulty: {formatDifficulty(ai.level)}
          <Buttons>
            <Button onClick={this.onOptions}>Options</Button>
          </Buttons>
        </AIInfo>
        {ai.thinking ? (
          <SpinnerContainer>
            <Spinner />
          </SpinnerContainer>
        ) : null}
        {this.renderOptions()}
      </WrapperDiv>
    );
  }

  renderOptions(): JSX.Element {
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
          {" — "}
          {ai.level * aiLevelFactor}s AI rounds
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
          <a href="https://ldjam.com/" target="_blank">
            Ludum Dare #40
          </a>
        </p>
        <Buttons>
          <Button className="large" onClick={this.onPlay}>
            Play
          </Button>
        </Buttons>
      </OptionsDiv>
    );
  }

  onMusicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.props.updateAi({
      musicEnabled: ev.currentTarget.checked,
    });
  };

  onOptions = () => {
    this.props.updateAi({
      optionsOpen: true,
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
      options.push(<option value={value[0]}>{value[1]}</option>);
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

  onPass = () => {
    this.props.playCard(null);
  };

  componentWillReceiveProps(nextProps: IProps & IDerivedProps) {
    if (this.props.controls.draggable) {
      if (!nextProps.controls.draggable) {
        document.removeEventListener("mousemove", this.onMouseMove);
      }
    } else {
      if (nextProps.controls.draggable) {
        // TODO: set initial clientX/clientY
        document.addEventListener("mousemove", this.onMouseMove);
        this.setState({
          clientX: globalMouse.clientX,
          clientY: globalMouse.clientY,
        });
      }
    }
  }

  onMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    this.setState({
      clientX,
      clientY,
    });
  };
}

interface IState {
  clientX: number;
  clientY: number;
}

interface IProps {}

interface IDerivedProps {
  system: ISystemState;
  metrics: IMetricsState;
  game: IGameState;
  controls: IControlsState;
  ai: IAIState;

  playCard: typeof actions.playCard;
  updateAi: typeof actions.updateAi;
}

export default connect<IProps>(PlayArea, {
  state: (rs: IRootState) => ({
    system: rs.system,
    metrics: rs.metrics,
    game: rs.game,
    controls: rs.controls,
    ai: rs.ai,
  }),
  actions: {
    playCard: actions.playCard,
    updateAi: actions.updateAi,
  },
});
