import { ChangeReport, Denormalized, EntityModel, ErrorType } from "./core";


export type QueryRunAction<TModel extends EntityModel,TReq,TEntityName extends keyof TModel> = {
    type: "CQ/QUERY-RUN"
    request: TReq
    viewSeq: string
    rootEntity: TEntityName
    maxDepth: number
}
 
export const queryRun = <TModel extends EntityModel,TReq,TEntityName extends keyof TModel>(request:TReq, viewSeq:string, rootEntity:TEntityName, maxDepth:number):QueryRunAction<TModel,TReq,TEntityName> => ({
    type: "CQ/QUERY-RUN",
    request,
    viewSeq,
    rootEntity,
    maxDepth
});

export interface QuerySuccessAction<TModel extends EntityModel,TReq,TEntityName extends keyof TModel> {
    type: "CQ/QUERY-SUCCESS"
    viewSeq: string
    request: TReq
    rootEntity: TEntityName
    maxDepth: number
    data: Denormalized<TModel,TModel[TEntityName]["props"]>[]
    total: number
}

export const querySuccess = <TModel extends EntityModel,TReq,TEntityName extends keyof TModel>(
    viewSeq:string, 
    request:TReq, 
    rootEntity: TEntityName, 
    maxDepth: number,
    data: Denormalized<TModel,TModel[TEntityName]["props"]>[],
    total: number):QuerySuccessAction<TModel,TReq,TEntityName> => ({
        type: "CQ/QUERY-SUCCESS",
        viewSeq,
        request,
        maxDepth,
        rootEntity,
        data,
        total
    })

export type QueryErrorAction<TReq> = {
    type: "CQ/QUERY-ERROR"
    viewSeq:string, 
    request:TReq, 
    errorType: ErrorType
    error: string
}

export const queryError = <TReq>(viewSeq:string, request:TReq, errorType:ErrorType, error:string):QueryErrorAction<TReq> => ({
    type: "CQ/QUERY-ERROR",
    viewSeq,
    request,
    errorType,
    error
})

export type ViewUnmountAction = {
    type: "CQ/VIEW-UNMOUNT"
    viewSeq: string
}

export const viewUnmount = (viewSeq:string):ViewUnmountAction => ({
    type: "CQ/VIEW-UNMOUNT",
    viewSeq
})

export type DataSyncAction<TModel extends EntityModel> = {
    type: "CQ/DATA-SYNC"
    changes: ChangeReport<TModel>
}

export const dataSync = <TModel extends EntityModel>(changes:ChangeReport<TModel>):DataSyncAction<TModel> => ({
    type: "CQ/DATA-SYNC",
    changes
})

export type CqAction<TModel extends EntityModel> = 
QueryRunAction<TModel,unknown,keyof TModel> | 
QuerySuccessAction<TModel,unknown,keyof TModel> | 
QueryErrorAction<unknown> |
DataSyncAction<TModel> |
ViewUnmountAction