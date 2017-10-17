`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let organizationQuery = require(`../common/queries/organization.js`).organizationQuery;
let userQuery = require(`../common/queries/user.js`).userQuery;

var serviceName = path.basename(__dirname);

function executeQuery(endCursor, next, context) {
    if (context.bindings.githubRepositoriesStep2.type == "organization") {
        let variables = JSON.stringify({
            end_cursor: endCursor,
            organization_name: context.bindings.githubRepositoriesStep2.login
        });
        gitHubHelper.executeQuery(organizationQuery, variables, next, context);
    }
    else if (context.bindings.githubRepositoriesStep2.type == "user") {
        {
            let variables = JSON.stringify({
                end_cursor: endCursor,
                user_login: context.bindings.githubRepositoriesStep2.login
            });
            gitHubHelper.executeQuery(userQuery, variables, next, context);
        }
    }
}

function processRepositoriesPage(graph, context) {
    let entity;
    if (context.bindings.githubRepositoriesStep2.type == "organization") {
        if (!graph || !graph.data || !graph.data.organization || !graph.data.organization.repositories || !graph.data.organization.repositories.edges) {
            context.bindings.githubRepositoriesStep3 = context.step3Messages;
            context.done();
            return;
        }
        entity = graph.data.organization;
    }
    else if (context.bindings.githubRepositoriesStep2.type == "user") {
        if (!graph || !graph.data || !graph.data.user || !graph.data.user.repositories || !graph.data.user.repositories.edges) {
            context.bindings.githubRepositoriesStep3 = context.step3Messages;
            context.done();
            return;
        }
        entity = graph.data.user;
    }  

    for (let i = 0; i < entity.repositories.edges.length; i++) {
        let repo = entity.repositories.edges[i].node;
        let topics = []
        // adding the topics as properties 
        for (let t = 0; t < repo.repositoryTopics.nodes.length; t++) {
            topics.push(repo.repositoryTopics.nodes[t].topic.name);
        }
        let document = {
            id: entity.id + `-` + repo.id,
            ownerId: entity.id,
            repositoryId: repo.id,
            repositoryOwner: entity.login,
            repositoryName: repo.name,
            resourcePath: repo.resourcePath,
            pushedAt: repo.pushedAt,
            type: context.bindings.githubRepositoriesStep2.type,
            isFork: repo.isFork,
            description: repo.description,
            topics: topics,
        };
        context.step3Messages.push(document);
    }

    if (entity.repositories.pageInfo.hasNextPage) {
        // to not being flagged as abused we wait 10 seconds before executing the next query
        context.log(`Wait 1 second before continuing query GitHub`);
        setTimeout(function() {
            executeQuery(entity.repositories.pageInfo.endCursor, processRepositoriesPage, context);
        }, 1000);
    }
    else {
        context.bindings.githubRepositoriesStep3 = context.step3Messages;
        context.done();
    }
}

module.exports = function (context) {
    try{
        context[`step3Messages`] = [];
        executeQuery(null, processRepositoriesPage, context);
    } 
    catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}