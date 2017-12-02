import * as React from "react";

import * as Notifications from "react-notification-system-redux";
import { IRootState } from "../types/index";
import { connect } from "./connect";

class MyNotifications extends React.Component<IProps> {
  render() {
    const { notifications } = this.props;

    //Optional styling
    const style = {
      NotificationItem: {
        // Override the notification item
        DefaultStyle: {
          // Applied to every notification, regardless of the notification level
          margin: "10px 5px 2px 1px",
          fontSize: "22px",
        },
      },
    };

    return <Notifications notifications={notifications} style={style} />;
  }
}

interface IProps {
  notifications: any[];
}

export default connect(MyNotifications, {
  state: (rs: IRootState) => ({ notifications: rs.notifications }),
});
