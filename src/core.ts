import { useSelector } from "react-redux"


export const ECQ_REDUCER_KEY = "__redux-ecq";

export type ErrorType = "bad-params" | "remote-failure" | "access-denied"

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

export interface EntityModel {
    [entityName:string]: CqEntity<Record<string,unknown>>
}  

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

export interface SView<TModel extends EntityModel,TEntityName extends keyof TModel,TReq,TResults extends QueryResults<DenormalizedType<TModel,TEntityName>>> {
    results: TResults
    rootKeys: string[]
    total: number
    rootEntity: string
    maxDepth: number
    pending: boolean
    lastError: string | null
    lastErrorType: ErrorType | null
    lastCreatedReq: TReq
    lastHandledReq: TReq | null
}

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
        [viewSeq:string]: SView<TModel,keyof TModel,unknown,any>
    }
}


type SInstallation<TModel extends EntityModel> = {
    "__redux-ecq": S<TModel>
}

type MayBe<T> = T | null | undefined;

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

type AllData = boolean | string | number | Date | MayBe<AllData>[] | { [prop:string]: MayBe<AllData> };

const denormalizeObject = <TModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return data;
    if (!(data instanceof Object)) throw "Expected object";
    return data;
}

const denormalizeString = <TModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return data;
    if (typeof data !== "string") throw "Expected string";
    return data;
}

const  denormalizeNumber = <TModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return data;
    if (typeof data !== "number") throw "Expected number";
    return data;
}

const denormalizeDate = <TModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return data;
    if (!(data instanceof Date)) throw "Expected Date";
    return data;
}

const denormalizeBoolean = <TModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return data;
    if (typeof data !== "boolean") throw "Expected boolean";
    return data;
}

function denormalizeRef<TModel extends EntityModel,TName extends keyof TModel>(model: TModel, db:EntityDb<TModel>, data:MayBe<AllData>, schema:CqRef<TModel,TName>, maxDepth:number) {
    if (data === undefined || data === null) return { };
    if (typeof data !== "string") throw "Expected string";
    const targetEntity = model[schema.target].props;
    const entitySet = db[schema.target];
    const targetData = entitySet ? entitySet[data] : undefined;
    if (targetData) {
        const denormalizedEntity:Record<string,MayBe<AllData>> = { };
        for (const prop in targetEntity) {
            denormalizedEntity[prop] = denormalize(model, db, targetData[prop], targetEntity[prop] as CqSchema<TModel>, maxDepth - 1);
        }
        return denormalizedEntity;
    }
    else {
        return { };
    }
}

export function denormalize<TModel extends EntityModel>(model: TModel, db:EntityDb<TModel>, data:MayBe<AllData>, schema:CqSchema<TModel>, maxDepth:number):MayBe<AllData> {
    if (Array.isArray(schema)) return denormalizeArray(model, db, data, schema[0], maxDepth);
    else if (schema.type === "ref") return denormalizeRef(model, db, data, schema, maxDepth);
    else if (schema.type === "boolean") return denormalizeBoolean(model, data);
    else if (schema.type === "string") return denormalizeString(model, data);
    else if (schema.type === "number") return denormalizeNumber(model, data);
    else if (schema.type === "datetime") return denormalizeDate(model, data);
    else if (schema.type === "object") return denormalizeObject(model, data);
    else throw "Unsupported schema type";
}

function denormalizeArray<TModel extends EntityModel>(model: TModel, db:EntityDb<TModel>, data:MayBe<AllData>, schema:CqDataType<TModel>, maxDepth:number) {
    if (data === undefined || data === null) return [];
    if ((typeof data === "string") || !Array.isArray(data)) throw "Expected array";
    return data.map(item => denormalize(model, db, item, schema, maxDepth)).filter(i => i !== undefined && i !== null);
}

type NormalizeResult<TModel extends EntityModel,T> = [MayBe<T>,EntityDb<TModel>];

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

const normalized = <TModel extends EntityModel,T>(model: TModel, value: T, db:EntityDb<TModel> = {}):NormalizeResult<TModel,T> => [value, db]

const normalizeObject = <TModel extends EntityModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return normalized(model, data);
    if (!(data instanceof Object)) throw "Expected object";
    return normalized(model, data);
}

const normalizeString = <TModel extends EntityModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return normalized(model, data);
    if (typeof data !== "string") throw "Expected string";
    return normalized(model, data);
}

const  normalizeNumber = <TModel extends EntityModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return normalized(model, data);
    if (typeof data !== "number") throw "Expected number";
    return normalized(model, data);
}

const normalizeDate = <TModel extends EntityModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return normalized(model, data);
    if (!(data instanceof Date)) throw "Expected Date";
    return normalized(model, data);
}

const normalizeBoolean = <TModel extends EntityModel>(model: TModel, data:MayBe<AllData>) => {
    if (data === undefined || data === null) return normalized(model, data);
    if (typeof data !== "boolean") throw "Expected boolean";
    return normalized(model, data);
}

function normalizeRef<TModel extends EntityModel,TName extends keyof TModel>(model: TModel, data:MayBe<AllData>, schema:CqRef<TModel,TName>) {
    if (data === undefined || data === null) return normalized(model, data);
    if (!(data instanceof Object)) throw "Expected instance of object";
    if (data instanceof Date) throw "Expected instance of object";
    if (Array.isArray(data)) throw "Expected instance of object";
    const def = model[schema.target];
    let db:EntityDb<TModel> = { };
    const normalizedMap:Record<string,MayBe<AllData>> = {};
    for (const prop in def.props) {
        const [nValue, dbFromProp] = normalize(model, data[prop], def.props[prop] as CqSchema<TModel>);
        normalizedMap[prop] = nValue;
        db = mergeEntities(db, dbFromProp);
    }
    
    return normalized(model, data[def.keyProp], { ...db, [schema.target]: { [data[def.keyProp] as string]: normalizedMap } });
}

export function normalizeArray<TModel extends EntityModel>(model: TModel, data:MayBe<AllData>, schema:CqDataType<TModel>) {
    if (data === undefined || data === null) return normalized(model, []);
    if ((typeof data === "string") || !Array.isArray(data)) throw "Expected array";
    const values:AllData[] = [];
    let db = { }
    for (const item of data) {
        const [value, dbFromValue] = normalize(model, item, schema);
        db = mergeEntities(db, dbFromValue);
        if (value !== null && value !== undefined) values.push(value);
    }
    return normalized(model, values, db);
}

export function normalize<TModel extends EntityModel>(model: TModel, data:MayBe<AllData>, schema:CqSchema<TModel>):NormalizeResult<TModel,AllData> {
    if (Array.isArray(schema)) return normalizeArray(model, data, schema[0]);
    else if (schema.type === "ref") return normalizeRef(model, data, schema);
    else if (schema.type === "boolean") return normalizeBoolean(model, data);
    else if (schema.type === "string") return normalizeString(model, data);
    else if (schema.type === "number") return normalizeNumber(model, data);
    else if (schema.type === "datetime") return normalizeDate(model, data);
    else if (schema.type === "object") return normalizeObject(model, data);
    else throw "Unsupported schema type";
}
