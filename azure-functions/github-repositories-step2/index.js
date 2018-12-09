`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let organizationQuery = require(`../common/queries/organization.js`).organizationQuery;
let userQuery = require(`../common/queries/user.js`).userQuery;

function executeQuery(endCursor, next, context) {
    let input = context.bindings.githubRepositoriesStep2;

    context.collectionSuffix = (input.collectionSuffix != undefined && input.collectionSuffix != null) ? input.collectionSuffix : "";

    if (input.type == "organization") {
        let variables = JSON.stringify({
            end_cursor: endCursor,
            organization_name: input.login
        });
        gitHubHelper.executeQuery(organizationQuery, variables, next, context);
    }
    else if (input.type == "user") {
        {
            let variables = JSON.stringify({
                end_cursor: endCursor,
                user_login: input.login
            });
            gitHubHelper.executeQuery(userQuery, variables, next, context);
        }
    }
}

function processRepositoriesPage(graph, context) {
    let entity;
    let location;
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
        location = entity.location;
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
            ownerId: repo.owner.id,
            repositoryId: repo.id,
            repositoryOwner: repo.owner.login,
            ownerLocation: location,
            repositoryName: repo.name,
            resourcePath: repo.resourcePath,
            pushedAt: repo.pushedAt,
            type: context.bindings.githubRepositoriesStep2.type,
            isFork: repo.isFork,
            forkCount: repo.forkCount,
            issuesCount: repo.issues.totalCount,
            starsCount: repo.stargazers.totalCount,
            watchersCount: repo.watchers.totalCount,
            description: repo.description,
            topics: topics,
            collectionSuffix: context.collectionSuffix
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