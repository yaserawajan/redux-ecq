import { AllData, CqDataType, CqRef, CqSchema, EntityDb, EntityModel, MayBe } from "./core";
import { mergeEntities } from "./entity";


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

export function denormalize<TModel extends EntityModel>(model: TModel, db: EntityDb<TModel>, data: MayBe<AllData>, schema: CqSchema<TModel>, maxDepth: number):MayBe<AllData> {
    if (Array.isArray(schema)) return denormalizeArray(model, db, data, schema[0], maxDepth);
    else if (schema.type === "ref") return denormalizeRef(model, db, data, schema, maxDepth);
    else if (schema.type === "boolean") return denormalizeBoolean(model, data);
    else if (schema.type === "string") return denormalizeString(model, data);
    else if (schema.type === "number") return denormalizeNumber(model, data);
    else if (schema.type === "datetime") return denormalizeDate(model, data);
    else if (schema.type === "object") return denormalizeObject(model, data);
    else throw "Unsupported schema type";
}

function denormalizeArray<TModel extends EntityModel>(model: TModel, db: EntityDb<TModel>, data: MayBe<AllData>, schema: CqDataType<TModel>, maxDepth: number) {
    if (data === undefined || data === null) return [];
    if ((typeof data === "string") || !Array.isArray(data)) throw "Expected array";
    return data.map(item => denormalize(model, db, item, schema, maxDepth)).filter(i => i !== undefined && i !== null);
}

type NormalizeResult<TModel extends EntityModel,T> = [MayBe<T>,EntityDb<TModel>];


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
