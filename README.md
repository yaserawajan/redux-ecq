# redux-ecq

**E** for Entity: an entity is a business object that has identity in the domain which we are building a front-end for. Typically, in any real-world application, a business domain can be seen as a collection of entities that refer to each other by identity.

**C** for Command: a call to a remote backend to modify the state of that backend, to execute a side-effect that changes the state of the world, e.g. place an order on an e-store, triggers a shipment ... etc.

**Q** for Query: On the other side, a query is a call to a remote backend to retrieve data without changing anything.

Redux ECQ is a library that allows developers to run commands and queries against backends while managing all the involved state, including query / command execution states and the state of data entities coming back from queries or being updated by commands. The library helps bring the following merits to front-end applications while alleviating the extra boilerplate code and indirection required to typically achieve that:

## Less or No Side-Effect-Managing Business Inside Components
The library offers hooks for watching query state and firing query requests in one-way fashion. 

## Reactive-Readiness
Redux ECQ is a library that leverages Redux to enable building React components that are really "reactive" in that they are agnostic to a backend's communication patterns (request-reply or push-based). A reactive component is one that does not "ask" for data but instead "tells" its need for data and then reacts to state changes as data arrives back, no promises involved.

## Normalized State of Front-end Data
Have you ever run in a situation where an entity view updates entity data while another view still holds the old values (e.g. updating the user's profile photo while the navbar still has the old one) ? we run into these issues often and this is a primary reason for using global state management libraries like Redux. 

In Redux documentation, the author recommends keeping data entities in a normalized state shape. Actually, this library has been inspired by Dan's "normalizr" library, but unlike "normalizr", which only provided methods for normalizing / denormalizing payloads, this library takes full care of entity management transparently. When a caller invokes a query, the library normalizes the results payload into a redux store and keeps a denormalized copy for binding to React components. The redux reducer takes care of synchronizing entities with denormalized views and it takes care of cleaning up entities that are not used by active / mounted views.

# Getting Started
## Installation
You can install the library using npm (or yarn if that's your preference):

```
npm install --save redux-ecq
```

The library is a typescript-first library, there is no need for installing any additional typings.

## Usage
### The Entity Model
To make use of the library, there is a corner stone object that has to be created, which is the entity model of the data the UI is dealing with. Typically, in every front-end application, there is an implicit mental model for the data, what kind of objects the UI is dealing with, the fields of information each contains and how objects relate to each other. We're going to make that model explicit by defining the following entity model for a fictuous shipment management application:

(let's have that model in a separate file since we'll be importing it from different places)

my_domain.ts

```ts
import { 
    jsEntity, 
    jsString,
    jsNumber,
    jsDateTime,
    jsRef,
    TypeOf
} from "redux-ecq";

export const entityModel = {
    shipment: jsEntity({
        id: jsString(),
        weight: jsNumber(),
        deliveryDate: jsDate(),
        shipper: jsRef("customer"),
        consignee: jsRef("customer")
    }, "id"),

    customer: jsEntity({
        accountId: jsString(),
        name: jsString()
    }, "accountId")
}

// Optionally, you can use TypeOf<> to compute the denormalized shape of an entity for using in your application. That saves you from the additional boilerplate of re-defining the above entities as Typescript types
export type Shipment = TypeOf<typeof entityModel, "shipment">
export type Customer = TypeOf<typeof entityModel, "customer">

```

** Please note that we are primarily concerned with objects that have identity, which we'll refer to as entities.

### Our First Query
This library adopts and encourages the usage of React hooks for managing all sorts of side-effects (commands and queries are side-effects). The following code creates a hook from a backend query that we will define:

my_queries.ts

```ts
import { queryHook } from "redux-ecq";
import { entityModel } from "./my_domain.ts"  // our entity model


interface ShipmentFindReq {
    shipmentId: string
}

export const useShipmentFinder = queryHook(entityModel, "shipment", (req:ShipmentFindReq) => {

    // this is an application defined callback to serves data from the backend in a denormalized shape adhering to the entity model
    // defined before. Replace the following with your real code that calls a remote backend and transforms the returned data into our domain's language

    return Promise.resolve({
        total: 2, 
        results: [
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

```

my_component.ts

```ts
import { useShipmentFinder } from "./my_queries";


const ShipmentSearchPanel = ({ }) => {

    const [queryState, find] = useShipmentFinder({ shipmentId: "111" });
    
    return (
        <div>
            {queryState.data.map(i => (<Shipment id={i.id} consigneeName={i.consignee.name} /* ... */ />))}
        </div>
    )
}

```

### Out First Command
Commands are actions that change data. The results of a command is one or changes to the entities affected by that command. We are going to write a sample / fictuous command that renames a customer account.

my_commands.ts

```ts
import { commandHook } from "redux-ecq";
import { entityModel } from "./my_domain.ts"  // our entity model


interface CustomerUpdateCommand {
    customerId: string
    newName: string
}

const useCustomerUpdater = commandHook(entityModel, (applyChanges) => 
    (cmd:CustomerUpdateCommand) => {

        // replace this with an actual backend call that returns a promise
        const backendCall = Promise.resolve({
            // Ideally, commands are one-way, but practically, in real world, sometimes backend commands are designed to return newly created IDs or other values. Result is the actual result that will go back to the 
            // ...
        });

        return backendCall.then(res => {
            // a call to this method will apply changes to concerned entities and dependent views will re-render accordingly
            applyChanges({
                modified: {
                    customer: {
                        [cmd.customerId]: {
                            name: cmd.newName
                        }
                    }
                }
            });
            // return expected response from command
            return res;
        })
});


```





