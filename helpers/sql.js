const { BadRequestError } = require("../expressError");

/* Allows data to be updated without having to input values for every column, will only update provided field values

If there are not any keys in the data passed in, throws error for no data to update.

Maps over keys in data and sets cols to be the column name (converts the javascript name to sql if needed) and the value to be the index + 1 (sql doesn't start at 0)

Returns object of columns, and values that needs to be updated
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
