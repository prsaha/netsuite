/**
@NApiVersion 2.1
@NModuleScope SameAccount
 */
define(['N/query'], function (query) {
    /**
  Utility to run paginated queries
  @param {Object} options - The configuration object
  @param {string} options.sql - Base SQL query string
  @param {number} [options.limit=9999999999] - Maximum number of records
  @param {number} [options.pageSize=5000] - Number of records per page
  @param {string} options.queryName - Identifier for the query (for logging)
  @returns {Array} - Combined results from all pages
  */
    const runQuery = ({ sql, limit, pageSize, queryName }) => {
        const functionName = "runQuery";
        let records = [];
        try {
            if (!sql) return [];
            const sqlPageSize = pageSize || 5000;
            let paginatedRowBegin = 1;
            let isMoreRecords = true;
            const startTime = new Date().getTime();
            do {
                // Adjust the SQL to fetch a specific page of records
                const paginatedSQL = `SELECT * FROM (
                        SELECT ROWNUM AS ROWNUMBER, t.* FROM ( ${sql} ) t
                      ) WHERE ROWNUMBER BETWEEN ${paginatedRowBegin} AND ${paginatedRowBegin + sqlPageSize - 1}`;
                const queryResults = query.runSuiteQL({ query: paginatedSQL, params: [] }).asMappedResults();
                records.push(...queryResults);
                if (queryResults.length < sqlPageSize) {
                    isMoreRecords = false;
                }
                paginatedRowBegin += sqlPageSize;
            } while (isMoreRecords);
            log.debug(`queryFetch (${queryName}) total time`, (new Date().getTime() - startTime) / 1000);
        } catch (ex) {
            let errorStr = (ex.name != null) ? ex.name + ' ' + ex.message : ex.toString();
            log.error('Error', `A problem occurred whilst ${queryName}: ${errorStr} in function ${functionName}`);
        }
        return records;
    };
    return {
        runQuery
    };
});






