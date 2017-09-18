`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let repositoryQuery = require(`../common/queries/repository.js`).repositoryQuery;

const MAX_COMMITS = 500;

function processResult(graph, context) {
    let result = context.result;
    for (let i = 0; i < graph.data.repository.defaultBranchRef.target.history.edges.length; i++) {
        result.history.push(graph.data.repository.defaultBranchRef.target.history.edges[i].node);
    }
    if ((result.history.length >= MAX_COMMITS) || (!graph.data.repository.defaultBranchRef.target.history.pageInfo.hasNextPag)) {
        context.bindings.githubRepositoriesDocument =  JSON.stringify(result);
        context.done();
    }
    else {
        executeQuery(context.bindings.githubRepositoriesStep2.repositoryOwner, context.bindings.githubRepositoriesStep2.repositoryName, graph.data.repository.defaultBranchRef.target.history.pageInfo.endCursor, context);
    }
}

function executeQuery(repositoryOwner, repositoryName, endCursor, context) {
    let variables = JSON.stringify({ 
        repository_owner : repositoryOwner,
        repository_name : repositoryName,
        end_cursor : endCursor
    });
    gitHubHelper.executeQuery(repositoryQuery, variables, processResult, context);
}

module.exports = function (context) {
    try{
        context['result'] = context.bindings.githubRepositoriesStep2;
        context.result[`history`] = [];
        executeQuery(context.bindings.githubRepositoriesStep2.repositoryOwner, context.bindings.githubRepositoriesStep2.repositoryName, null, context);
    } catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}