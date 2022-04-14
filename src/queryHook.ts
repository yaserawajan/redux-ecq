import { Dispatch, useEffect, useState } from "react"
import { shallowEqual, useDispatch } from "react-redux"
import { querySuccess, queryRun, viewUnmount, CqAction, queryError } from "./actions"
import { QueryResults, useEcqSelector, EntityModel, SQuery, DenormalizedType } from "./core"


export type AsyncQueryHandler<TReq,TData,TRes extends QueryResults<TData>> = (req:TReq) => Promise<TRes>

export type QueryHook<TModel extends EntityModel,TReq,TName extends keyof TModel,TRes extends QueryResults<DenormalizedType<TModel,TName>>> = (initReq:TReq, maxDepth:number) => [SQuery<TModel,TReq,TName,TRes>,(req:TReq) => void]
  
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
                        dispatch(querySuccess(entityModel, viewSeq, req, entityName, maxDepth, res));
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

