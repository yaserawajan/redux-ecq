/**
 * @jest-environment jsdom
 */

import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import '@testing-library/jest-dom';
import { createEcqReducer } from "../src/reducers";
import { queryHook } from "../src/hookApi";
import { 
    jsEntity, 
    jsString,
    jsNumber,
    jsDateTime,
    jsRef,
    ECQ_REDUCER_KEY,
} from "../src/core";
import { act } from "react-dom/test-utils";


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

interface ShipmentReq {
    id: string
}

const useQuery = queryHook(entityModel, "shipment", (req:ShipmentReq) => {
    return Promise.resolve({
        total: 2, 
        data: [
            {
                id: "1",
                weight: 45,
                deliveryDate: new Date(2022, 11, 1),
                shipper: {
                    accountId: "acc3",
                    name: "Mary Jane"
                },
                consignee: {
                    accountId: "acc1",
                    name: "John Doe",
                },

            },
            {
                id: "2",
                weight: 23,
                deliveryDate: new Date(),
                shipper: {
                    accountId: "acc3",
                    name: "Mary Jane"
                },
                consignee: {
                    accountId: "acc1",
                    name: "John Doe",
                }
            }
        ]
    });
});


it("does nothing if no request is given and ensures an empty data array", async () => {

    const store = createStore(combineReducers({ [ECQ_REDUCER_KEY]: createEcqReducer(entityModel) }))

    const C = () => {
        const [queryState, newRequest] = useQuery();
        return queryState.results !== null
            ? <div>somedata</div>
            : <div><div>nodata</div><button onClick={() => newRequest({ id: "123" })}>getsome</button></div>; 
    }

    
    render(
        <Provider store={store}>
            <C />
        </Provider>
    );
    
    
    // assert it's fail
    expect(screen.getByText('nodata')).not.toBeNull();

    const el =  screen.getByText("getsome");

    fireEvent.click(el);
    
    const elAfter = await waitFor(() => screen.getByText('somedata'));

    expect(elAfter).not.toBeNull();
    
});

it("fires a request if given and refires if it changes", async () => {

    // const store = createStore(combineReducers({ [ECQ_REDUCER_KEY]: createEcqReducer(entityModel) }))

    // const C = () => {
    //     const [queryState, newRequest] = useQuery({ id: "123" });
    //     return queryState.results !== null
    //         ? <div>somedata</div>
    //         : <div><div>nodata</div><button onClick={() => newRequest({ id: "123" })}>getsome</button></div>; 
    // }

    // render(
    //     <Provider store={store}>
    //         <C />
    //     </Provider>
    // );
    
    
    // // assert it's fail
    // expect(screen.getByText('nodata')).not.toBeNull();

    // const el =  screen.getByText("getsome");

    // fireEvent.click(el);
    
    // const elAfter = await waitFor(() => screen.getByText('somedata'));

    // expect(elAfter).not.toBeNull();
   

})