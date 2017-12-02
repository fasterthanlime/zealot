import * as Msgs from "../types/msgs";

const epsilon = 0.0001;

export function epsEqual(a, b: number): boolean {
  return Math.abs(a - b) < epsilon;
}

export function epsEqualPos(a, b: Msgs.Pos): boolean {
  return epsEqual(a.c, b.c) && epsEqual(a.r, b.r);
}
