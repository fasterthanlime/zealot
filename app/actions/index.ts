import { IAction } from "../types/index";

export function createAction<PayloadType>(type: string) {
  if (typeof type !== "string" || type.length === 0) {
    throw new Error(`Invalid action type for creator: ${type}`);
  }

  return (payload: PayloadType): IAction<PayloadType> => {
    return {
      type,
      payload,
    };
  };
}

interface IMirrorInput {
  [key: string]: null;
}

type IMirrorOutput<T> = { [key in keyof T]: string };

function mirror<T extends IMirrorInput>(input: T): IMirrorOutput<T> {
  const res: IMirrorOutput<T> = {} as any;
  for (const k of Object.keys(input)) {
    res[k] = k;
  }
  return res;
}

export const types = mirror({
  BOOT: null,
});

export const boot = createAction<{}>(types.BOOT);
