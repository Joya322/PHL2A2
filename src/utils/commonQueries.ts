// select users using email
export const selectDataByAColumn = (tableName: string, columnName: string) => {
  return `SELECT * FROM ${tableName} WHERE ${columnName}=$1`;
};
