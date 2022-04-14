import { Dispatch, useEffect, useState } from "react"
import { shallowEqual, useDispatch } from "react-redux"
import { querySuccess, queryRun, viewUnmount, dataSync, CqAction, queryError } from "./actions"
import { QueryResults, useEcqSelector, EntityModel, ChangeReport, SQuery, DenormalizedType, SCommand } from "./core"


export type AsyncQueryHandler<TReq,TData,TRes extends QueryResults<TData>> = (req:TReq) => Promise<TRes>

export type QueryHook<TModel extends EntityModel,TReq,TName extends keyof TModel,TRes extends QueryResults<DenormalizedType<TModel,TName>>> = (initReq:TReq, maxDepth:number) => [SQuery<TModel,TReq,TName,TRes>,(req:TReq) => void]

export type CommandResponse<TPayload> = TPayload

export type CommandHandler<TCommand,TRes> = (params:TCommand) => Promise<TRes>

export type Updater<TModel extends EntityModel> = (updates:Partial<ChangeReport<TModel>>) => void
  
let __seq = 0;
const nextId = () => ++__seq;

export const queryHook = <
    TModel extends EntityModel,
    TReq extends object,
    TName extends keyof TModel,
    TData extends DenormalizedType<TModel,TName>,
    TRes extends QueryResults<TData>>(
    entityModel: TModel, 
    entityName:TName, 
    handler: AsyncQueryHandler<TReq,TData,TRes>) => {

        const createFetcher = (viewSeq: string, dispatch: Dispatch<CqAction<TModel>>, maxDepth: number) =>
            (req:TReq) => {
                dispatch(queryRun(req, viewSeq, entityName, maxDepth));
                handler(req)
                    .then(res => {
                        dispatch(querySuccess(viewSeq, req, entityName, maxDepth, res));
                    })
                    .catch(error => {
                        dispatch(queryError(viewSeq, req, error))
                    });
            }
    
        const initViewState = (req: TReq | undefined) => ({
            results: null,
            pending: req !== undefined,
            lastError: null,
            lastCreatedReq: req ?? { },
            lastHandledReq: { }
        });

        return (req?: TReq, maxDepth?: number): [SQuery<TModel,TReq,TName,TRes>, (req: TReq) => void] => {
            /* eslint-disable */
            const [viewSeq, _] = useState(nextId().toString());
            /* eslint-enable */
            const sView = useEcqSelector(s => (viewSeq in s.views) 
                ? s.views[viewSeq] as SQuery<TModel,TReq,TName,TRes>
                : initViewState(req), shallowEqual);
            const dispatch = useDispatch();

            // view mounting / unmounting
            const fetcher = createFetcher(viewSeq, dispatch, maxDepth || 3);

            useEffect(() => {
                if (req !== undefined) {
                    fetcher(req);
                }
                return () => {
                    dispatch(viewUnmount(viewSeq));
                }
            }, req === undefined ? [] : Object.values(req));

            // return view state and one-way fetcher method
            return [sView, fetcher];
        }
    
}

export type CommandHandlerFactory<TModel extends EntityModel,TCommand,TRes> = (applyChanges: Updater<TModel>) => CommandHandler<TCommand,TRes>; 

export type CommandDispatcher<TCommand> = (req: TCommand) => void

export const commandHook = <
    TModel extends EntityModel,
    TCommand,
    TRes>(entityModel: TModel, handlerFactory: CommandHandlerFactory<TModel,TCommand,TRes>) => {

        const sInit:SCommand<TCommand,TRes> = {
            results: null,
            pending: false,
            success: false,
            lastError: null,
            lastCreatedReq: { },
            lastHandledReq: { }
        }

        return ():[SCommand<TCommand,TRes>, CommandDispatcher<TCommand>] => {

            const [state, setState] = useState(sInit);

            const dispatch = useDispatch();

            const updater = (updates:Partial<ChangeReport<TModel>>) => {
                dispatch(dataSync({
                    modified: { },
                    created: { },
                    deleted: { },
                    ...updates
                }));
            }
            
            const promiseHandler = handlerFactory(updater);

            const commandSaga = (req: TCommand) => {

                setState(s => ({
                    ...s,
                    pending: true,
                    lastError: null,
                    success: false,
                    lastCreatedReq: req
                }));

                promiseHandler(req)
                    .then(res => {
                        setState(s => ({
                            ...s,
                            lastError: null,
                            results: res,
                            pending: false,
                            success: true,
                            lastHandledReq: req
                        }))
                    })
                    .catch(err => {
                        setState(s => ({
                            ...s,
                            pending: false,
                            results: null,
                            success: false,
                            lastError: err,
                            lastHandledReq: req
                        }));
                    });
            }

            return [state, commandSaga];
        }
};
