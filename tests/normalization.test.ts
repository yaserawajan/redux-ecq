import { jsEntity, jsString, jsRef, jsNumber } from "../src";
import { normalize, denormalize } from "../src/normalization";


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


it('normalizes / denormalizes payload', () => {
    const testOrder = {
        id: "123",
        country: "JO",
        customer: {
            id: "888",
            fullName: "John Doe",
            gender: "male"
        },
        lineItems: [
            {
                id: "1",
                product: "Hair Dryer",
                qty: 3
            },
            {
                id: "2",
                product: "Watermelon",
                qty: 2
            }
        ]
    };

    const [normalizedOrder, db] = normalize(entityModel, testOrder, jsRef("order"))

    expect(normalizedOrder).toBe("123");
    
    expect(db).toStrictEqual(testDb);

    const denormalizedOrder = denormalize(entityModel, db, "123", jsRef("order"), 3);
    expect(denormalizedOrder).toStrictEqual(testOrder);
});
