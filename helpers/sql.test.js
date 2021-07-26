const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("test sqlPartialUpdate", function(){
    test("works: data provided to update", function () {
        const data = {"username": "test", "firstName": "Test", "lastName": "Tester"};
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
          };
        const updateData = sqlForPartialUpdate(data, jsToSql);
        expect(updateData).toEqual({
            setCols: '"username"=$1, "first_name"=$2, "last_name"=$3',
            values: ["test","Test","Tester"]
        })
    })

    test("works: returns error if no data provided", function () {
        const data = {};
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
          };
        expect(() => sqlForPartialUpdate(data, jsToSql).toThrow(BadRequestError));
        
    })
})
