import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import produce from "immer";

export const configureStore = ({
  reducer,
  middleware = [thunk],
  preloadedState,
}) => {
  return createStore(
    typeof reducer === "function" ? reducer : combineReducers(reducer),
    preloadedState,
    applyMiddleware(...middleware)
  );
};

export const createAction = (type, prepareAction) => {
  const actionCreator = (payload) => ({
    type,
    payload: prepareAction ? prepareAction(payload).payload : payload,
  });
  actionCreator.type = type;
  return actionCreator;
};

export const createReducer = (initialState, actionsMap) => {
  return (state = initialState, action) => {
    const reducer = actionsMap[action.type];
    if (reducer) {
      return produce(state, (draft) => {
        reducer(draft, action);
      });
    }
    return state;
  };
};

export const createSlice = ({ name, initialState, reducers }) => {
  const actions = {};
  const prefixActionsMap = {};
  Object.keys(reducers).forEach((actionType) => {
    const prefixActionType = name + "/" + actionType;
    actions[actionType] = createAction(prefixActionType);
    prefixActionsMap[prefixActionType] = reducers[actionType];
  });
  return {
    reducer: createReducer(initialState, prefixActionsMap),
    actions,
  };
};

export const createAsyncThunk = (type, payloadCreator) => {
  const pending = createAction(type + "/pending");
  const fulfilled = createAction(type + "/fulfilled");
  const rejected = createAction(type + "/rejected");

  const actionCreator = (arg) => {
    return (dispatch) => {
      dispatch(pending());
      return payloadCreator(arg)
        .then((res) => {
          dispatch(fulfilled(res));
        })
        .catch((err) => {
          dispatch(rejected(err));
        });
    };
  };

  return Object.assign(actionCreator, {
    pending,
    fulfilled,
    rejected,
  });
};
