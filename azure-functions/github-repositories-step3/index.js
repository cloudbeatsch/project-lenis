`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let repositoryQuery = require(`../common/queries/repository.js`).repositoryQuery;

const MAX_COMMITS = 100000;

function entries (obj) {
    let entries = []
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && obj.propertyIsEnumerable(key)) {
            entry = {contributor : key, commits : obj[key]};
            entries.push(entry);
        }
    }
    return entries;
}

function done(context) {
    context.log(`Adding commits to cosmos db`);
    context.result[`history`] = entries(context.history);
    context.bindings['githubRepositoriesDocument' + context.collectionSuffix] =  JSON.stringify(context.result);
    context.done();
}

function processResult(graph, context) {
    let result = context.result;
    if (!graph || !graph.data || !graph.data.repository || !graph.data.repository.defaultBranchRef || !graph.data.repository.defaultBranchRef.target) {
        done(context);
        return;
    }
    for (let i = 0; i < graph.data.repository.defaultBranchRef.target.history.edges.length; i++) {
        let commit = graph.data.repository.defaultBranchRef.target.history.edges[i].node;
        context.nrOfCommits++;
        if (commit.author.user) {
            if (context.history[commit.author.user.login]) {
                context.history[commit.author.user.login].contributions++;
            }
            else {
                context.history[commit.author.user.login] = { 
                    id: commit.author.user.id,
                    location : commit.author.user.location,  
                    contributions : 1
                };               
            }
        }
    }

    if ((context.nrOfCommits >= MAX_COMMITS) || (!graph.data.repository.defaultBranchRef.target.history.pageInfo.hasNextPage)) {
        done(context);
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
        let repoDetails = context.bindings.githubRepositoriesStep3;

        context[`result`] = repoDetails;
        context[`history`] = [];
        context[`nrOfCommits`] = 0;

        context.collectionSuffix = 
            (repoDetails.collectionSuffix != undefined && repoDetails.collectionSuffix != null && repoDetails.collectionSuffix.length > 0) ?
                repoDetails.collectionSuffix :
                "";
            delete repoDetails.collectionSuffix;

        if (context.result.isFork == false) {
            executeQuery(repoDetails.repositoryOwner, repoDetails.repositoryName, null, context);
        }
        else {
            done(context);
        }
    } 
    catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
    finally{

    }
}