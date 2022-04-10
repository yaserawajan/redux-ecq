import { EntityModel, Denormalized } from "./core";

export { queryHook, commandHook } from "./hookApi";
export { jsEntity, jsRef, jsBoolean, jsNumber, jsDateTime, jsString, ECQ_REDUCER_KEY, Denormalized, EntityModel } from "./core";
export { createEcqReducer } from "./reducers";

export type TypeOf<TModel extends EntityModel,TName extends keyof TModel> = Denormalized<TModel,TModel[TName]["props"]>

