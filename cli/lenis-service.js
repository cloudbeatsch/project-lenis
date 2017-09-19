#!/usr/bin/env node

var program = require('commander');
var azure = require("azure-storage");
var lenis = require("./lenis.js");
var profile = require('./profile.json');
var glob = require("glob");

var tableName = 'lenis'
var tableService = azure.createTableService(profile.connectionstring)

program
    .command('list')
    .description('list all the current services')
    .action(() => { listServices() });

program
    .command('get <service>')
    .description('get the current service configuration')
    .action((service) => { getServiceConfig(service) });

program
    .command('apply <service>')
    .description('remove an organisation')
    .option('-f, --file <file>', 'configuration file name')
    .action((service, options) => {
        if (!options.file)
            throw new Error('--file required')
        var configPath = options.file
        var prefix = configPath.substring(0, Math.min(configPath.length, 2))
        if (prefix !== "./") {
            configPath = "./" + configPath
        }
        applyServiceConfig(service, configPath)
    });

program.parse(process.argv);

function listServices() {
    executeQuery(null, (results) => {
        for (var i = 0; i < results.length; i++) {
            console.log(results[i].ServiceName['_'])
        }
    })
}

function getServiceConfig(service) {
    var query = new azure.TableQuery()
        .where('ServiceName eq ?', service);
    executeQuery(query, (results) => {
        if (results.length > 0) {
            var config = JSON.parse(results[0].Configuration['_'])
            console.log(config)
        }
    })
}

function applyServiceConfig(service, configFilename) {
    var config = require(configFilename);
    var query = new azure.TableQuery()
        .where('ServiceName eq ?', service);
    var entity = null
    executeQuery(query, (results) => {
        if (results.length > 0) {
            var entity = results[0]
            entity.Configuration = JSON.stringify(config, null, 2)
            tableService.mergeEntity(tableName, entity, (error, result, resp) => {
                if (error) {
                    throw error
                }
            });
        } else {
            throw new Error("No results found for service named " + service)
        }
    })
}

function executeQuery(query, callback) {
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