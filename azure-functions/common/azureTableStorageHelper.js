"use strict";

function executeAzureQuery(tableService, tableName, query, callback) {
    var aggregatedResults = []
    var nextContinuationToken = null;
    tableService.queryEntities(tableName,
        query,
        nextContinuationToken,
        function (error, results) {
            if (error) throw error;
            if (results != null) {
                for (var i = 0; i < results.entries.length; i++) {
                    aggregatedResults.push(results.entries[i])
                }
            }
            if (results.continuationToken) {
                nextContinuationToken = results.continuationToken;
            } else {
                callback(aggregatedResults)
            }
        });
}

module.exports = {
    executeAzureQuery: executeAzureQuery
}