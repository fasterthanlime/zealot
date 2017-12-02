import all from "./all";
import { IRootState, IAction } from "../types";

export default function reduce(
  rs: IRootState,
  action: IAction<any>,
): IRootState {
  return all(rs, action);
}
