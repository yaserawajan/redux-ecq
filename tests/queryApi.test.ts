/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
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
import { createElement } from "react";


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

it("does nothing if no request is given and ensures an empty data array", () => {

    const store = createStore(combineReducers({ [ECQ_REDUCER_KEY]: createEcqReducer(entityModel) }))

    const TestComponent = () => {
        const [queryState, _] = useQuery();
        return createElement("div", {},
            queryState.results.data
                .map(i => createElement("div", {}, i.weight)));
    }

    const result = render(createElement(Provider, { store }, createElement(TestComponent)));

});