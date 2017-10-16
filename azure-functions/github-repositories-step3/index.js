`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let repositoryQuery = require(`../common/queries/repository.js`).repositoryQuery;

const MAX_COMMITS = 1000;

function processResult(graph, context) {
    let result = context.result;
    if (!graph || !graph.data || !graph.data.repository || !graph.data.repository.defaultBranchRef || !graph.data.repository.defaultBranchRef.target) {
        context.log(`Adding commits to cosmos db`);
        context.bindings.githubRepositoriesDocument =  JSON.stringify(result);
        context.done();
        return;
    }
    for (let i = 0; i < graph.data.repository.defaultBranchRef.target.history.edges.length; i++) {
        let commit = graph.data.repository.defaultBranchRef.target.history.edges[i].node;
        
        let commitObj = {};
        if (commit.author.user) {
            commitObj[`login`] = commit.author.user.login;
        }
        if (commit.committedDate){
            commitObj[`committedDate`] = commit.committedDate;
        }
        result.history.push({commitObj});
    }

    if ((result.history.length >= MAX_COMMITS) || (!graph.data.repository.defaultBranchRef.target.history.pageInfo.hasNextPage)) {
        context.log(`Adding commits to cosmos db`);
        context.bindings.githubRepositoriesDocument =  JSON.stringify(result);
        context.done();
        return;
    }
    else {
        // to not being flagged as abused we wait 2 seconds before executing the next query
        context.log(`Wait 2 seconds before continuing query GitHub`);
        setTimeout(function() {
            executeQuery(context.bindings.githubRepositoriesStep3.repositoryOwner, context.bindings.githubRepositoriesStep3.repositoryName, graph.data.repository.defaultBranchRef.target.history.pageInfo.endCursor, context);
          }, 2000);
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
    try {
        context['result'] = context.bindings.githubRepositoriesStep3;
        context.result[`history`] = [];
        executeQuery(context.bindings.githubRepositoriesStep3.repositoryOwner, context.bindings.githubRepositoriesStep3.repositoryName, null, context);
    } 
    catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}