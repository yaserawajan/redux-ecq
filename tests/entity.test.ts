import { jsEntity, jsNumber, jsRef, jsString, removeEntities } from "../src/entity";


export { }

const entityModel = {

    customer: jsEntity({
        id: jsString(),
        fullName: jsString(),
        gender: jsString(),
    }, "id"),

    order: jsEntity({
        id: jsString(),
        country: jsString(),
        customer: jsRef("customer"),
        lineItems: [jsRef("orderLineItem")]
    }, "id"),

    orderLineItem: jsEntity({
        id: jsString(),
        product: jsString(),
        qty: jsNumber()
    }, "id")
}

const testDb = {
    order: {
        "123": {
            id: "123",
            country: "JO",
            customer: "888",
            lineItems: ["1", "2"]
        }
    },
    customer: {
        "888": {
            id: "888",
            fullName: "John Doe",
            gender: "male"
        }
    },
    orderLineItem: {
        "1": {
            id: "1",
            product: "Hair Dryer",
            qty: 3
        },
        "2": {
            id: "2",
            product: "Watermelon",
            qty: 2
        }
    }
}

it("removes entities", () => {

    const refs = {
        order: {
            "123": true,
            "234": true
        }
    }

    const dbAfter = removeEntities(testDb, refs);
    expect(dbAfter).toStrictEqual({
        order: { },
        customer: {
            "888": {
                id: "888",
                fullName: "John Doe",
                gender: "male"
            }
        },
        orderLineItem: {
            "1": {
                id: "1",
                product: "Hair Dryer",
                qty: 3
            },
            "2": {
                id: "2",
                product: "Watermelon",
                qty: 2
            }
        }
    })
})

