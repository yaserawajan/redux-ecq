import { CqObject, CqString, CqNumber, CqBoolean, CqDateTime, EntityModel, CqRef, CqEntity, EntityDb, EntityRefCollection } from "./core"


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

export const mergeEntities = <TModel extends EntityModel>(left:EntityDb<TModel>, right: EntityDb<TModel>):EntityDb<TModel> => {
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

