`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let organizationQuery = require(`../common/queries/organization.js`).organizationQuery;
let azureTableHelper = require(`../common/azureTableStorageHelper.js`)
let azure = require('azure-storage');
let path = require('path');

var serviceName = path.basename(__dirname);
var tableName = 'lenis'
var tableService = azure.createTableService()

function executeOrganizationQuery(organizationName, endCursor, next, context) {
    let variables = JSON.stringify({
        end_cursor: endCursor,
        organization_name: organizationName
    });
    gitHubHelper.executeQuery(organizationQuery, variables, next, context);
}

function processOrganizationRepositoryPage(graph, context) {
    for (let i = 0; i < graph.data.organization.repositories.edges.length; i++) {
        let repo = graph.data.organization.repositories.edges[i].node;
        let topics = []
        // adding the topics as properties 
        for (let t = 0; t < repo.repositoryTopics.nodes.length; t++) {
            topics.push(repo.repositoryTopics.nodes[t].topic.name);
        }
        let document = {
            id: graph.data.organization.id + `-` + repo.id,
            organizationId: graph.data.organization.id,
            repositoryId: repo.id,
            organizationName: graph.data.organization.name,
            organizationLogin: graph.data.organization.login,
            repositoryOwner: graph.data.organization.login,
            repositoryName: repo.name,
            resourcePath: repo.resourcePath,
            pushedAt: repo.pushedAt,
            isFork: repo.isFork,
            description: repo.description,
            topics: topics,
        };
        context.step2Messages.push(document);
    }

    if (graph.data.organization.repositories.pageInfo.hasNextPage) {
        executeOrganizationQuery(graph.data.organization.login, graph.data.organization.repositories.pageInfo.endCursor, processOrganizationRepositoryPage, context);
    }
    else {
        context.bindings.githubRepositoriesStep2 = context.step2Messages;
        context.done();
    }
}

function processRepositories(context) {
    context[`step2Messages`] = [];
    let orgs = getOrganisations((orgs, err) => {
        if (err) {
            throw err
        }
        for (let i = 0; i < orgs.length; i++) {
            executeOrganizationQuery(orgs[i], null, processOrganizationRepositoryPage, context);
        }
    });
}

function getOrganisations(callback) {
    var query = new azure.TableQuery()
        .where('ServiceName eq ?', serviceName);
    azureTableHelper.executeAzureQuery(tableService, tableName, query, (results) => {
        if (results.length > 0) {
            var config = JSON.parse(results[0].Configuration['_'])
            var orgs = config.organisations.split(',')
            return callback(orgs, null)
        }
        return callback(null, new Error("Couldn't retrieve configuration for service " + serviceName))
    })
}

module.exports = function (context) {
    try {
        context.log('Node.js queue trigger function processed work item', context.bindings.myQueueItem);
        processRepositories(context);
    } catch (error) {
        exceptionHelper.raiseException(error, true, context);
    }
}