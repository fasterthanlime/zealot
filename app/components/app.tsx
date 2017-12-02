import * as React from "react";
import { connect } from "./connect";
import styled from "./styles";
import { IRootState } from "../types/index";
import PlayArea from "./play-area";

const StatusDiv = styled.div`
  margin: 40px;
  font-size: 28px;
  line-height: 1.4;
  text-align: center;

  .line {
    margin-bottom: 28px;
  }

  a {
    background: ${props => props.theme.accent};
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    color: white;
    text-decoration: none;
    padding: 12px 20px;
  }
`;

class App extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    return (
      <div>
        <StatusDiv>Hi!</StatusDiv>
        <PlayArea />
      </div>
    );
  }
}

interface IProps {}

interface IDerivedProps {}

export default connect<IProps>(App, {
  state: (rs: IRootState) => ({
    // muffin
  }),
});
