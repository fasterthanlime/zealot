import styled from "./styles";

export const Buttons = styled.div`
  text-align: center;

  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
`;

export const Button = styled.div`
  border: 1px solid #afa9a933;
  box-shadow: 0 0 1px black;
  border-radius: 2px;
  background: #232323;
  padding: 12px 40px;
  margin: 12px;

  opacity: 0.9;
  transform: scale(1);
  transition: transform 0.2s;

  &:hover {
    opacity: 1;
    transform: scale(1.04);
  }

  &.small {
    font-size: 16px;
    padding: 5px 14px;
    margin: 6px;
  }

  &.medium {
    font-size: 20px;
    padding: 6px 16px;
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
