import { Reducer, Action } from "redux";

export default function derived<T>(
  reducer: Reducer<any>,
  derivedReducer: (state: any) => any,
): Reducer<T> {
  return (state: T, action: Action) => {
    const reducerFields = reducer(state, action);
    if (state) {
      return {
        ...reducerFields,
        ...derivedReducer(reducerFields),
      };
    } else {
      return reducerFields;
    }
  };
}
