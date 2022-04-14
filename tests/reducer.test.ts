import { combineReducers, createStore } from "redux";
import { jsEntity, jsString, jsNumber, jsDateTime, jsRef, ECQ_REDUCER_KEY, createEcqReducer } from "../src"
import { queryRun, querySuccess } from "../src/actions";

export { }

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

const initStore = () => createStore(combineReducers({ [ECQ_REDUCER_KEY]: createEcqReducer(entityModel) }));

it("runs a successful query cycle and renders views and normalized entities", () => {

    const store = initStore();
    
    const req = { id: "123",  };

    store.dispatch(queryRun(req, "1", "customer", 3));

    const responseFromBackend = {
        data: [
            {
                accountId: "acc3",
                name: "Mary Jane"
            },
            {
                accountId: "acc1",
                name: "John Doe"
            }
        ]
    };

    store.dispatch(querySuccess(entityModel, "1", req, "customer", 3, responseFromBackend));

    const state = store.getState();

    const resultsInView = state[ECQ_REDUCER_KEY].views["1"]?.results;

    expect(resultsInView).toStrictEqual(responseFromBackend);
});

it("runs a successful query cycle and renders views and normalized entities", () => {

    const store = initStore();
    
    const req = { id: "123",  };

    store.dispatch(queryRun(req, "1", "customer", 3));

    const responseFromBackend = {
        data: [
            {
                accountId: "acc3",
                name: "Mary Jane"
            },
            {
                accountId: "acc1",
                name: "John Doe"
            }
        ]
    };

    store.dispatch(querySuccess(entityModel, "1", req, "customer", 3, responseFromBackend));

    const state = store.getState();

    const resultsInView = state[ECQ_REDUCER_KEY].views["1"]?.results;

    expect(resultsInView).toStrictEqual(responseFromBackend);
});
