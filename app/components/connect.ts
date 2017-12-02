import { connect as reduxConnect } from "react-redux";

import { IRootState, IDispatch, IAction, dispatcher } from "../types";

interface IStateMapper {
  (rs: IRootState, props: any): any;
}

interface IDispatchMapper {
  (dispatch: IDispatch, props: any): any;
}

interface IConnectOpts {
  state?: IStateMapper;
  dispatch?: IDispatchMapper;
  actions?: {
    [key: string]: (payload: any) => IAction<any>;
  };
}

export function connect<TProps>(
  component: React.ComponentClass<any>,
  opts: IConnectOpts = {},
): React.ComponentClass<TProps> {
  let { dispatch, actions } = opts;
  if (actions) {
    let oldDispatch = dispatch;
    dispatch = (d, props) => {
      const result: any = oldDispatch ? oldDispatch(d, props) : {};
      for (const key of Object.keys(actions!)) {
        result[key] = dispatcher(d, actions![key]);
      }
      return result;
    };
  }

  return reduxConnect(opts.state, dispatch)(component);
}
