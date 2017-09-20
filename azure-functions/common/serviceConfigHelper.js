"use strict";

let azure = require('azure-storage');

var tableService = azure.createTableService()

function setupConfig(tableName, serviceName, callback) {
    createConfigStoreIfNotExist(tableName, () => {
        createServiceConfigIfNotExist(tableName, serviceName, (err, serviceConfig) => {
            callback(err, serviceConfig)
        })
    })
}

function createConfigStoreIfNotExist(tableName, callback) {
    tableService.createTableIfNotExists(tableName, (err, result, response) => {
        if(err) {
            throw err
        }
        return callback()
    });
}

function createServiceConfigIfNotExist(tableName, serviceName, callback) {
    getServiceConfig(tableName, serviceName, (err, serviceConfig) => {
        if(err) {
            return createServiceConfig(tableName, serviceName, callback)
        }
        return callback(null, serviceConfig)
    })
}

function createServiceConfig(tableName, serviceName, callback) {
    var entity = {
        PartitionKey: "0",
        RowKey: serviceName,
        Configuration: JSON.stringify({organizations: ""})
    }
    tableService.insertEntity(tableName, entity, (err, result, resp) => {
        if (err) {
            return callback(err, null)
        }
        return callback(null, result.entity)
    });
}

function getServiceConfig(tableName, serviceName, callback) {
    var query = new azure.TableQuery()
    .where('RowKey eq ?', serviceName);

    executeQuery(tableName, query, (results) => {
        if(results.length > 0) {
            var serviceConfig = JSON.parse(results[0].Configuration['_'])
            return callback(null, serviceConfig)
        }
        return callback(new Error('Service with name ' + serviceName + ' not found'), null)
    })
}

function executeQuery(tableName, query, callback) {
    var aggregatedResults = []
    var nextContinuationToken = null;
    tableService.queryEntities(tableName,
        query,
        nextContinuationToken,
        (error, results) => {
            if (error) throw error;
            if (results != null) {
                for (var i = 0; i < results.entries.length; i++) {
                    aggregatedResults.push(results.entries[i])
                }
            }
            if (results.continuationToken) {
                nextContinuationToken = results.continuationToken;
            } else {
                return callback(aggregatedResults)
            }
        });
}

module.exports = {
    setupConfig: setupConfig,
    getServiceConfig: getServiceConfig
}