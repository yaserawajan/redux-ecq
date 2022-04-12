import { Dispatch, useEffect, useState } from "react"
import { shallowEqual, useDispatch } from "react-redux"
import { querySuccess, queryRun, viewUnmount, dataSync, CqAction } from "./actions"
import { QueryResponse, useEcqSelector, EntityModel, Denormalized, ChangeReport, ErrorType } from "./core"


export type AsyncQueryHandler<TReq,TData> = (req:TReq) => Promise<QueryResponse<TData>>

export type SQuery<TModel extends EntityModel,TReq,TEntityName extends keyof TModel> = {
    data: Denormalized<TModel,TModel[TEntityName]["props"]>[]
    total: number
    pending: boolean
    lastError: string | null
    lastErrorType: ErrorType | null
    lastCreatedReq: TReq
    lastHandledReq: Partial<TReq>
} 

export type QueryHook<TModel extends EntityModel,TReq,TName extends keyof TModel> = (initReq:TReq, maxDepth:number) => [SQuery<TModel,TReq,TName>,(req:TReq) => void]

export type CommandResponse<TPayload> = TPayload

export type CommandHandler<TCommand,TRes> = (params:TCommand) => Promise<CommandResponse<TRes>>

export type Updater<TModel extends EntityModel> = (updates:Partial<ChangeReport<TModel>>) => void
  
let __seq = 0;
const nextId = () => ++__seq;

export const queryHook = <
    TModel extends EntityModel,
    TReq extends Record<string,unknown>,
    TName extends keyof TModel,
    TProps extends TModel[TName]["props"],
    TData extends Denormalized<TModel,TProps>>(
    entityModel:TModel, 
    entityName:TName, 
    handler:AsyncQueryHandler<TReq,TData>) => {

        const createFetcher = (viewSeq:string, dispatch:Dispatch<CqAction<TModel>>, maxDepth:number) =>
            (req:TReq) => {
                dispatch(queryRun(req, viewSeq, entityName, maxDepth));
                handler(req)
                    .then(res => {
                        dispatch(querySuccess(viewSeq, req, entityName, maxDepth, res.results, res.total));
                    }); 
            }
    
        const initViewState = (req: TReq | Record<string,never>) => ({
            data: [],
            pending: true,
            lastError: null,
            lastErrorType: null,
            total: 0,
            lastCreatedReq: req,
            lastHandledReq: {}
        });

        return (req?: TReq, maxDepth = 3): [SQuery<TModel,TReq,TName>, (req:TReq) => void] => {
            /* eslint-disable */
            const [viewSeq, _] = useState(nextId().toString());
            /* eslint-enable */
            const sView = useEcqSelector(s => s.views[viewSeq] as SQuery<TModel,TReq,TName> ?? initViewState(req ?? { }), shallowEqual);
            const dispatch = useDispatch();

            // view mounting / unmounting
            const fetcher = createFetcher(viewSeq, dispatch, maxDepth);

            useEffect(() => {
                if (req !== undefined) {
                    fetcher(req);
                }
                return () => {
                    dispatch(viewUnmount(viewSeq));
                }
            }, Object.values(req ?? { })); //[initReq]);

            // return view state and one-way fetcher method
            return [sView, fetcher];
        }
    
}

export const commandHook = <
    TModel extends EntityModel,
    TCommand,
    TRes>(entityModel:TModel, handlerFactory:(applyChanges:Updater<TModel>) => CommandHandler<TCommand,TRes>) => {

        return () => {
            const dispatch = useDispatch();

            const updater = (updates:Partial<ChangeReport<TModel>>) => {
                dispatch(dataSync({
                    modified: { },
                    created: { },
                    deleted: { },
                    ...updates
                }));
            }

            return handlerFactory(updater);
        }
};
