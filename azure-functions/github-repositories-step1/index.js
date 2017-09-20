`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let organizationQuery = require(`../common/queries/organization.js`).organizationQuery;
let configHelper = require(`../common/serviceConfigHelper.js`)
let query = require(`azure-storage`);
let path = require(`path`);

var serviceName = path.basename(__dirname);
var tableName = process.env['AZURE_STORAGE_TABLE_NAME']

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
    getOrganizations((err, orgs) => {
        if(err) {
            throw err
        }
        if(orgs) {
            for (let i = 0; i < orgs.length; i++) {
                executeOrganizationQuery(orgs[i], null, processOrganizationRepositoryPage, context);
            }
        }
    });
}

function getOrganizations(callback) {
    configHelper.getServiceConfig(tableName, serviceName, (err, serviceConfig) => {
        if(err) {
            return callback(err, null)
        }
        var orgs = serviceConfig.organizations.length > 0 ? serviceConfig.organizations.split(',') : null
        return callback(null, orgs)
    })
}

module.exports = function (context) {
    try {
        configHelper.setupConfig(tableName, serviceName, (err, serviceConfig) => {
            if(err) {
                return context.error('Cannot load service config, error: ' + err.toString())
            }
            context.log('Node.js queue trigger function processed work item', context.bindings.myQueueItem);
            processRepositories(context);
        })
    } catch (error) {
        exceptionHelper.raiseException(error, true, context);
    }
}