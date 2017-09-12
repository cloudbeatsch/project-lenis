"use strict";

let util = require('util');
let appInsights = require("applicationinsights");
let request = require('request-promise');
let appInsightsClient = appInsights.getClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function RaiseException(errorMsg, exit, context){
    context.log('github-repositories error occurred: ' + errorMsg);

    if(appInsightsClient.config){
        appInsightsClient.trackException(new Error(errorMsg));
        if(exit && context){
            context.log("Exiting from error " + errorMsg);
            context.done(errorMsg);
        }
    }else{
        context.log('App Insight is not properly setup. Please make sure APPINSIGHTS_INSTRUMENTATIONKEY is defined');
    }
}

function executeQuery(graphRequest, processResult, context) {
    var uri = 'https://api.github.com/graphql';
    var result = request({
        method: 'POST',
        uri,
        headers: {
            'Authorization': 'bearer ' + GITHUB_TOKEN,
            'User-Agent': `project-lenis`
        },
        body : graphRequest, 
        json: true
    }).then(function (result) {
        context.log(`got response: ${util.inspect(result)}`);
        processResult(result, context);
    })
    .catch(function(err) {
        var errorMessage = `Could not retrieve graph: ${graphRequest}`;
        context.log(errorMessage);
        throw new Error(errorMessage);
    });
}

function processResult(graph, context) {
    let document = context.bindings.githubRepositoriesStep2;
    document[`history`] = []
    for (let i = 0; i < graph.data.organization.repository.defaultBranchRef.target.history.edges.length; i++) {
        document.history.push(graph.data.organization.repository.defaultBranchRef.target.history.edges[i].node);
    }
    context.bindings.githubRepositoriesDocument =  JSON.stringify(document);
    context.done();
}

function processRepository(organizationName, repositoryName, context){
    let queryTemplate = `{
            organization(login: "ORG_PLACEHOLDER") {
              repository( name : "REPOSITORY_PLACEHOLDER") {
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
                            history(first: 100) {
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
      }`
      let queryTemplateOrg = queryTemplate.replace(`ORG_PLACEHOLDER`, organizationName );
      let queryString = queryTemplateOrg.replace(`REPOSITORY_PLACEHOLDER`, repositoryName);
      executeQuery({query: queryString}, processResult, context);
}

module.exports = function (context) {
    try{
        processRepository(context.bindings.githubRepositoriesStep2.organizationLogin, context.bindings.githubRepositoriesStep2.repositoryName, context);
    } catch(error) {
        RaiseException(error, true, context);
    }
}