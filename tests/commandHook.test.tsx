/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import '@testing-library/jest-dom';
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { commandHook, createEcqReducer, ECQ_REDUCER_KEY, jsDateTime, jsEntity, jsNumber, jsRef, jsString } from "../src";


const entityModel = {
    shipment: jsEntity({
        id: jsString(),
        weight: jsNumber(),
        deliveryDate: jsDateTime(),
        shipper: jsRef("customer"),
        consignee: jsRef("customer")
    }, "id"),

    customer: jsEntity({
        accountId: jsString(),
        name: jsString()
    }, "accountId")
}

interface CustomerRenameCommand {
    customerId: string
    newName: string
    error?: string
}

const useCommand = commandHook(entityModel, (applyChanges) => 
    (req:CustomerRenameCommand) => {

        if (req.error) {
            return Promise.reject(req.error);
        }
        else {
            applyChanges({
                modified: {
                    customer: {
                        [req.customerId]: {
                            name: req.newName
                        }
                    }
                }
            });
            return Promise.resolve("123");
        }

    });

export { }

it("invokes a command and updates state", async () => {

    const store = createStore(combineReducers({ [ECQ_REDUCER_KEY]: createEcqReducer(entityModel) }))

    const C = () => {
        const [commandState, newCommand] = useCommand();
    
        return commandState.success
            ? <div role="result">{commandState.results}</div>
            : <button role="button" onClick={() => newCommand({ customerId: "123", newName: "Jonnie" })}>run</button>; 
    }

    render(
        <Provider store={store}>
            <C />
        </Provider>
    );

    fireEvent.click(screen.getByRole("button"));

    const el = await waitFor(() => screen.getByRole("result"));

    expect(el).toHaveTextContent("123");

});

it("ignores a request if another is already running", () => {


});

