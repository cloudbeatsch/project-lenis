'use strict'

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let collaboratedRepositoryQuery = require(`../common/queries/repository.js`).collaboratedRepositoryQuery;



function processResult(graph, context) {
  let result = context.result;
  graph.data.user.contributedRepositories.nodes.forEach(r => { 
    result.contributions.push(r);
  });
  if(graph.data.user.contributedRepositories.pageInfo.hasNextPage) {
    executeQuery(result.login, graph.data.user.contributedRepositories.pageInfo.endCursor, context);
  } else {
    context.bindings.githubCollaborationsDocument = JSON.stringify(result)
    context.done();
  }
}

function executeQuery(login, endCursor, context) {
  const variables = JSON.stringify({
    login: login,
    end_cursor: endCursor
  });
  gitHubHelper.executeQuery(collaboratedRepositoryQuery, variables, processResult, context);
}

module.exports = function (context) {
  try{
      context.result = {}
      context.result.login = context.bindings.githubCollabQueue;
      context.result.contributions = [];
      executeQuery(context.result.login, null, context);
  } catch(error) {
      exceptionHelper.raiseException(error, true, context);
  }
}