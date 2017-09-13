`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);

const QUERY = `query ($organization_name:String!, $repository_name:String! ){
    organization(login: $organization_name) {
      repository( name : $repository_name) {
            name
            resourcePath
            pushedAt
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
            isFork
            description
            defaultBranchRef {
              target {
                      ... on Commit {
                    id
                    history(first: 90) {
                edges {
                    node {
                    url
                      messageHeadline
                      oid
                      message
                      author {
                        name
                      date
                      }
                    }
                  }
                }
              }
          }
        }
    }
  }
}`;

function processResult(graph, context) {
    let document = context.bindings.githubRepositoriesStep2;
    document[`history`] = []
    for (let i = 0; i < graph.data.organization.repository.defaultBranchRef.target.history.edges.length; i++) {
        document.history.push(graph.data.organization.repository.defaultBranchRef.target.history.edges[i].node);
    }
    context.bindings.githubRepositoriesDocument =  JSON.stringify(document);
    context.done();
}

function executeQuery(organizationName, repositoryName, next, context) {
    let variables = JSON.stringify({ 
        repository_name : repositoryName,
        organization_name : organizationName
    });
    gitHubHelper.executeQuery(QUERY, variables, next, context);
}

module.exports = function (context) {
    try{
        executeQuery(context.bindings.githubRepositoriesStep2.organizationLogin, context.bindings.githubRepositoriesStep2.repositoryName, processResult, context);
    } catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}