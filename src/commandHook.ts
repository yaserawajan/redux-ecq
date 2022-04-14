import { useState } from "react";
import { useDispatch } from "react-redux";
import { dataSync } from "./actions";
import { EntityModel, ChangeReport, SCommand } from "./core";


export type CommandResponse<TPayload> = TPayload

export type CommandHandler<TCommand,TRes> = (params:TCommand) => Promise<TRes>

export type Updater<TModel extends EntityModel> = (updates:Partial<ChangeReport<TModel>>) => void

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
                        }));
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
