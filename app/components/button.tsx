import styled from "./styles";

export const Buttons = styled.div`
  text-align: center;
`;

export const Button = styled.div`
  border: 1px solid #afa9a933;
  box-shadow: 0 0 1px black;
  border-radius: 2px;
  background: #232323;
  padding: 12px 40px;
  margin: 12px;

  &.small {
    font-size: 13px;
    padding: 4px 12px;
    margin: 8px;
  }

  &.large {
    font-size: 28px;
  }

  &:hover {
    cursor: pointer;
  }

  display: inline-block;
`;
