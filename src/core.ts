import { useSelector } from "react-redux"


export const ECQ_REDUCER_KEY = "__redux-ecq";

export type EntityRefCollection = {
    [entity:string]: { [k: string]: boolean }
}

export interface ChangeReport<TModel extends EntityModel> {
    created: EntityDb<TModel>
    modified: EntityDb<TModel>
    deleted: EntityRefCollection
}

export interface QueryResults<TData> {
    data: TData[]
}

export interface CqRef<TModel extends EntityModel,TTarget extends keyof TModel> {
    type: "ref"
    target: TTarget
}

export interface CqObject {
    type: "object"
}

export interface CqString {
    type: "string"
}

export interface CqNumber {
    type: "number"
}

export interface CqDateTime {
    type: "datetime"
}

export interface CqBoolean {
    type: "boolean"
}

export interface CqEntity<TProps> {
    type: "entity"
    keyProp: string
    props: TProps
}

export type CqDataType<TModel extends EntityModel> = CqRef<TModel,keyof TModel> | CqString | CqNumber | CqDateTime | CqBoolean | CqObject;

export type CqSchema<TModel extends EntityModel> = CqDataType<TModel> | CqDataType<TModel>[];

export type EntityModel = Record<string,CqEntity<Record<string,unknown>>>

type Array<T> = T[]

type Process<TModel extends EntityModel,T> = 
    (T extends CqNumber
        ? number
        : (T extends CqString
            ? string
            : (T extends CqDateTime
                ? Date
                : (T extends CqBoolean
                    ? boolean
                    /* eslint-disable */
                    : (T extends CqRef<TModel,infer _>
                    /* eslint-enable */
                        ? Denormalized<TModel,TModel[T["target"]]["props"]>
                        : (T extends CqObject
                            ? object
                            : never))))))

export type Denormalized<TModel extends EntityModel,TProps> = {
    [prop in keyof TProps]: TProps[prop] extends Array<infer Item>
        ? Process<TModel,Item>[]
        : Process<TModel,TProps[prop]>
}

export type DenormalizedType<TModel extends EntityModel,TName extends keyof TModel> = Denormalized<TModel,TModel[TName]["props"]>

export interface SView<TModel extends EntityModel,TEntityName extends keyof TModel,TReq,TRes extends QueryResults<DenormalizedType<TModel,TEntityName>>> {
    results: TRes | null
    rootKeys: string[]
    rootEntity: TEntityName
    maxDepth: number
    pending: boolean
    lastError?: any
    lastCreatedReq: TReq
    lastHandledReq: TReq | null
}

export type SQuery<TModel extends EntityModel,TReq,TEntityName extends keyof TModel,TRes extends QueryResults<DenormalizedType<TModel,TEntityName>>> = {
    results: TRes | null
    pending: boolean
    lastError?: any
    lastCreatedReq: TReq | Record<string,never>
    lastHandledReq: TReq | Record<string,never>
}

export type SCommand<TReq,TRes> = {
    results: TRes | null
    success: boolean
    pending: boolean
    lastError?: any
    lastCreatedReq: TReq | Record<string,never>
    lastHandledReq: TReq | Record<string,never>
}

export type MayBe<T> = T | null | undefined;

export type AllData = boolean | string | number | Date | MayBe<AllData>[] | { [prop:string]: MayBe<AllData> };

export type EntityData<TProps> = Record<string,Record<keyof TProps,AllData>>

export type EntityDb<TModel extends EntityModel> = {
    [type in keyof TModel]?:EntityData<TModel[type]["props"]>
}

export type DependencyTable = {
    [entityName: string]: {
        [entityKey:string]: {
            [viewSeq:string]: boolean
        }
    }
}

export interface S<TModel extends EntityModel> {
    deps: DependencyTable
    entities: EntityDb<TModel>
    views: {
        [viewSeq:string]: SView<TModel,keyof TModel,unknown,QueryResults<DenormalizedType<TModel,keyof TModel>>>
    }
}


type SInstallation<TModel extends EntityModel> = {
    "__redux-ecq": S<TModel>
}

type EqualityFn<T> = undefined | ((l:T, r:T) => boolean)

type CqSelector<TFrom,TTo> = (s:TFrom) => TTo

export const useEcqSelector = <TModel extends EntityModel,SGlobal extends SInstallation<TModel>,T>(selector:CqSelector<S<TModel>,T>, equalityFn:EqualityFn<T>=undefined) => 
    useSelector((s:SGlobal) => selector(s[ECQ_REDUCER_KEY]), equalityFn);

export const jsObject = (): CqObject => ({ type: "object" })

export const jsString = (): CqString => ({ type: "string" })

export const jsNumber = ():CqNumber => ({ type: "number" })

export const jsBoolean = ():CqBoolean => ({ type: "boolean" })

export const jsDateTime = ():CqDateTime => ({ type: "datetime" })

export const jsRef = <TModel extends EntityModel,TTarget extends keyof TModel>(target:TTarget):CqRef<TModel,TTarget> => ({ type: "ref", target })

export const jsEntity = <TProps extends {[k:string]:unknown},TKey extends keyof TProps>(props:TProps, keyProp:TKey):CqEntity<TProps> => ({ keyProp:keyProp as string, props, type: "entity" })

export const uniqueEntityRefs = <TModel extends EntityModel>(entities:EntityDb<TModel>) => {
    const unique:EntityRefCollection = { }
    for (const type in entities) {
        unique[type] = unique[type] || { };
        for (const key in entities[type]) {
            unique[type][key] = true
        }
    }
    return unique;
}

export const mergeEntityRefs = (...refs:EntityRefCollection[]) => {
    const combined:EntityRefCollection = { }
    for (const ref of refs) {
        for (const toAdd in ref) {
            combined[toAdd] = {
                ...combined[toAdd],
                ...ref[toAdd]
            }
        }
    }
    return combined;
}

export const removeEntities = <TModel extends EntityModel>(db:EntityDb<TModel>, refs:EntityRefCollection):EntityDb<TModel> => {
    const dbNew:EntityDb<TModel> = { };
    for (const type in db) {
        dbNew[type] = { };
        for (const key in db[type]) {
            if (!(type in refs) || !(key in refs[type])) {
                (dbNew[type])[key] = (db[type])[key];
            }
        }
    }
    return dbNew;
}

export function mergeEntities<TModel extends EntityModel>(left:EntityDb<TModel>, right: EntityDb<TModel>):EntityDb<TModel> {
    const dbNew:EntityDb<TModel> = { };
    for (const type in left) {
        dbNew[type] = dbNew[type] || { };
        for (const key in left[type]) {
            (dbNew[type])[key] = { ...(left[type])[key] };
        }
    }

    for (const type in right) {
        dbNew[type] = dbNew[type] || { };
        for (const key in right[type]) {
            (dbNew[type])[key] = { ...(dbNew[type])[key], ...(right[type])[key] };
        }
    }

    return dbNew;
}

