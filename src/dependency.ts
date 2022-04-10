import { DependencyTable, EntityRefCollection } from "./core";


const cloneDeps = (deps:DependencyTable) => {
    let clone:DependencyTable = { }
    for (const type in deps) {
        clone[type] = { }
        for (const key in deps[type]) {
            clone[type][key] = {
                ...deps[type][key]
            }
        }
    }
    return clone;
}

export const addDeps = (deps:DependencyTable, viewSeq:string, entities:EntityRefCollection) => {
    let moreDeps = cloneDeps(deps);
    for (const type in entities) {
        moreDeps[type] = moreDeps[type] ?? { };
        for (const key in entities[type]) {
            moreDeps[type][key] = {
                ...moreDeps[type][key],
                [viewSeq]: true
            }
        }
    }
    return moreDeps;
}

export const viewsByEntities = (deps: DependencyTable, entities:EntityRefCollection) => 
    Object.fromEntries(
        Object.keys(entities)
            .flatMap((type) => 
                Object.keys(entities[type])
                    .filter(key => (deps[type] && deps[type][key]))
                    .flatMap(key => Object.entries(deps[type][key]))));

export const orphanEntities = (deps: DependencyTable) => (
    Object.fromEntries(
        Object.entries(deps).map(([type, data]) => [
            type, 
            Object.fromEntries(
                Object.entries(data)
                    .filter(([_, viewSeqs]) => Object.keys(viewSeqs).length < 1)
                    .map(([key, _]) => [key, true]))
        ]).filter(([_, l]) => Object.keys(l).length > 0)));

export const removeDepEntities = (deps:DependencyTable, entities:EntityRefCollection) => {
    const newEntries = Object.entries(deps)
        .map(([type, keys]) => [
            type, 
            Object.fromEntries(Object.entries(keys)
                .filter(([key, _]) => !(type in entities) || !(key in (entities[type] ?? {}))))
        ]);
    return Object.fromEntries(newEntries);
}

export const removeDepView = (deps:DependencyTable,  viewSeq:string):DependencyTable => {
    const newEntries = Object.entries(deps)
        .map(([type, keys]) => [
            type, 
            Object.fromEntries(Object.entries(keys).map(([key, { [viewSeq]:_, ...rest }]) => [key, rest]))
        ]);
    return Object.fromEntries(newEntries);
}
