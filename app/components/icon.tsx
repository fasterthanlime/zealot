import * as React from "react";

export default class Icon extends React.PureComponent<IProps> {
  render() {
    const { icon, className = "" } = this.props;
    return <span className={`icon icon-${icon} ${className}`} />;
  }
}

interface IProps {
  icon: string;
  className?: string;
}
