
import { addDeps, orphanEntities, removeDepEntities, removeDepView, viewsByEntities } from "../src/dependency";


export { }

it("Adds views and entities", () => {

    let depsAfter = addDeps({ }, "1", {
        "order": {
            "123": true,
            "234": true
        },
        "product": {
            "222": true,
            "333": true
        } 
    });

    expect(depsAfter).toStrictEqual({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true
            }
        },
        "product": {
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    });

    depsAfter = addDeps(depsAfter, "2", {
        "product": {
            "22": true
        },
        "order": {
            "234": true
        }  
    });

    expect(depsAfter).toStrictEqual({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true,
                "2": true
            }
        },
        "product": {
            "22": {
                "2": true
            },
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    })

});

it("removes dependent entities", () => {

    let depsAfter = removeDepEntities({ }, {
        "product": {
            "22": true
        },
        "order": {
            "234": true
        }  
    });

    expect(depsAfter).toStrictEqual({ });

    depsAfter = removeDepEntities({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true,
                "2": true
            }
        },
        "product": {
            "22": {
                "2": true
            },
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    }, {
        "product": {
            "22": true
        },
        "order": {
            "234": true
        }  
    });

    expect(depsAfter).toStrictEqual({
        "order": {
            "123": {
                "1": true
            }
        },
        "product": {
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        }
    })
});

it("removes dependent views", () => {
    let depsAfter = removeDepView({ }, "3");
    expect(depsAfter).toStrictEqual({ });

    depsAfter = removeDepView({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true,
                "2": true
            }
        },
        "product": {
            "22": {
                "2": true
            },
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    }, "2");

    expect(depsAfter).toStrictEqual({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true
            }
        },
        "product": {
            "22": { },
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    });
});

it("returns orphan entities", () => {
    let orphans = orphanEntities({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true
            }
        },
        "product": {
            "22": { },
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    });

    expect(orphans).toStrictEqual({
        "product": {
            "22": true
        }
    });

    orphans = orphanEntities({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true
            }
        },
        "product": {
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    });

    expect(orphans).toStrictEqual({ });
});

it("returns views depdnent on given entities", () => {

    let depViews = viewsByEntities({
        "order": {
            "123": {
                "1": true
            },
            "234": {
                "1": true
            }
        },
        "product": {
            "22": { },
            "222": {
                "1": true
            },
            "333": {
                "1": true
            }
        } 
    }, {
        "product": {
            "22": true,
            
        }
    });

    expect(depViews).toStrictEqual({ });

    depViews = viewsByEntities({
        "order": {
            "123": {
                "2": true
            },
            "234": {
                "1": true
            }
        },
        "product": {
            "22": { 
                "2": true
            },
            "222": {
                "1": true
            },
            "333": {
                "3": true,
                "4": true
            }
        } 
    }, {
        "order": {
            "123": true
        },
        "product": {
            "22": true,
            "333": true
        }
    });

    expect(depViews).toStrictEqual({
        "2": true,
        "3": true,
        "4": true
    });
});
