import { CqAction } from "./actions";
import { EntityModel, denormalize, S, jsRef, normalizeArray, mergeEntities, mergeEntityRefs, uniqueEntityRefs, removeEntities, EntityDb, DependencyTable } from "./core";
import { addDeps, orphanEntities, removeDepEntities, removeDepView, viewsByEntities } from "./dependency";


export const createEcqReducer = <TModel extends EntityModel>(entityModel: TModel) => {

    const sInit:S<TModel> = {
        entities: { },
        views: { },
        deps: { }
    }

    const purgeEntities = (s: S<TModel>, viewSeq:string):[EntityDb<TModel>, DependencyTable] => {
        // cleanup entities referenced by existing view
        const depsCleanup = removeDepView(s.deps, viewSeq);
        const orphans = orphanEntities(depsCleanup);
        const deps = removeDepEntities(depsCleanup, orphans);
        const entities = removeEntities(s.entities, orphans);
        return [entities, deps];
    }

    return (s:S<TModel> = sInit, action:CqAction<TModel>):S<TModel> => {

        if (action.type === "CQ/QUERY-RUN") {
            return {
                ...s,
                views: {
                    ...s.views,
                    [action.viewSeq]: {
                        ...s.views[action.viewSeq],
                        pending: true,
                        lastCreatedReq: action.request
                    }
                }
            }
        }
 
        else if (action.type === "CQ/QUERY-SUCCESS") {
            // only if the receiving view is mounted and the response belongs to the last created request
            if (action.viewSeq in s.views && action.request === s.views[action.viewSeq].lastCreatedReq) { 
                // cleanup entities referenced by existing view
                const [entities, deps] = purgeEntities(s, action.viewSeq);
                // normalize payload
                const [rootKeys, updates] = normalizeArray(entityModel, action.results.data, jsRef(action.rootEntity));
                // merge entities
                const updatedEntities = mergeEntities(entities, updates);
                // denormalize data again to ensure consistency
                const data = denormalize(entityModel, updatedEntities, rootKeys, [jsRef(action.rootEntity)], action.maxDepth) as [];
                return {
                    ...s,
                    deps: addDeps(deps, action.viewSeq, uniqueEntityRefs(updates)),
                    entities: updatedEntities,
                    views: {
                        ...s.views,
                        [action.viewSeq]: {
                            ...s.views[action.viewSeq],
                            rootKeys: rootKeys !== null ? rootKeys as string[] : [], 
                            pending: false,
                            lastError: null,
                            lastErrorType: null,
                            results: {
                                ...action.results,
                                data
                            },
                            lastHandledReq: action.request,
                            rootEntity: action.rootEntity as string,
                            maxDepth: action.maxDepth
                        }
                    }
                }
            }
        }

        else if (action.type === "CQ/VIEW-UNMOUNT") {
            /* eslint-disable */
            const { [action.viewSeq]:_oldView, ...views } = s.views;
            /* eslint-enable */
            // remove view from dependency table
            const [entities, deps] = purgeEntities(s, action.viewSeq);
            // updated state
            return { ...s, views, deps, entities };
        }

        else if (action.type === "CQ/DATA-SYNC") {
            const { created, modified, deleted } = action.changes;
            const entities = removeEntities(mergeEntities(mergeEntities(s.entities, created), modified), deleted);
            // determine dependent views
            const depViews = viewsByEntities(s.deps, mergeEntityRefs(
                uniqueEntityRefs(created), 
                uniqueEntityRefs(modified), 
                deleted));
            // remove deps of deleted entities
            const deps = removeDepEntities(s.deps, deleted);
            // denormalize views
            const viewEntries = Object.entries(s.views).map(([viewSeq, view]) => [
                viewSeq,
                (viewSeq in depViews)
                    ? { 
                        ...view, 
                        results: {
                            ...view.results,
                            data: denormalize(entityModel, entities, view.rootKeys, [jsRef(view.rootEntity)], view.maxDepth)
                        }
                    }
                    : view
            ]);
            const views = Object.fromEntries(viewEntries);
            // updated state
            return { ...s, deps, views, entities };
        }

        else if (action.type === "CQ/QUERY-ERROR") {
            // only if the receiving view is mounted and the response belongs to the last created request
            if (action.viewSeq in s.views && action.request === s.views[action.viewSeq].lastCreatedReq) {
                return {
                    ...s,
                    views: {
                        ...s.views,
                        [action.viewSeq]: {
                            ...s.views[action.viewSeq],
                            pending: false,
                            lastError: action.error,
                            lastErrorType: action.errorType
                        }
                    }
                };
            }
        }

        return s;
    }

}