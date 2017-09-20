#!/usr/bin/env node

var program = require('commander');
var azure = require("azure-storage");
var lenis = require("./lenis.js");
var profile = require('./profile.json');
var glob = require("glob");

if (profile.tableConnectionString === "") {
    return console.log("Login required before any service operations can be performed")
}

var tableName = profile.tableName
var tableService = azure.createTableService(profile.tableConnectionString)

program
    .command('list')
    .description('list all the current services')
    .action(() => {
        listServices()
    });

program
    .command('get <service>')
    .description('get the current service configuration')
    .action((service) => {
        if (profile.tableConnectionString === "") {
            return console.log("Login required before any operations can be performed")
        }
        getServiceConfig(service)
    });

program
    .command('apply <service>')
    .description('remove an organization')
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

if (program.args.length < 1) {
    program.help()
  } else {
    if (!program._execs[program.args[0]]) {
      console.log('Unknown Command')
      program.help()
    }
  }

function listServices() {
    executeQuery(null, (results) => {
        for (var i = 0; i < results.length; i++) {
            console.log(results[i].RowKey['_'])
        }
    })
}

function getServiceConfig(service) {
    var query = new azure.TableQuery()
        .where('RowKey eq ?', service);
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
        .where('RowKey eq ?', service);
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