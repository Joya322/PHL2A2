// select users using email
export const selectUsersByAColumn = (tableName: string, columnName: string) => {
    return `SELECT * FROM ${tableName} WHERE ${columnName}=$1`;
}
  
