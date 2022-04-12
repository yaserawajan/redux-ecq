
export { queryHook, commandHook } from "./hookApi";

export { jsEntity, jsRef, jsBoolean, jsNumber, jsDateTime, jsString, useEcqSelector, ECQ_REDUCER_KEY } from "./core";

export { createEcqReducer } from "./reducers";

export { EntityModel, SView, S, CqString, CqBoolean, CqDataType, CqDateTime, CqEntity, CqNumber, CqObject, CqRef, CqSchema } from "./core";

export { AsyncQueryHandler, Updater, SQuery, CommandHandler, CommandResponse, QueryHook } from "./hookApi";

import { EntityModel, Denormalized } from "./core";
export type DenormalizedType<TModel extends EntityModel,TName extends keyof TModel> = Denormalized<TModel,TModel[TName]["props"]>

