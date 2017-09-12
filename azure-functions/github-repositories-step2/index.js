"use strict";

let util = require('util');
let appInsights = require("applicationinsights");
let request = require('request-promise');
let appInsightsClient = appInsights.getClient();
let globalContext;



const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function RaiseException(errorMsg, exit){
    globalContext.log('github-repositories error occurred: ' + errorMsg);

    if(appInsightsClient.config){
        appInsightsClient.trackException(new Error(errorMsg));
        if(exit && globalContext){
            globalContext.log("Exiting from error " + errorMsg);
            globalContext.done(errorMsg);
        }
    }else{
        globalContext.log('App Insight is not properly setup. Please make sure APPINSIGHTS_INSTRUMENTATIONKEY is defined');
    }
}

function executeQuery(graphRequest, queryTemplate, next) {
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
        globalContext.log(`got response: ${util.inspect(result)}`);
        next(queryTemplate, result);
    })
    .catch(function(err) {
        var errorMessage = `Could not retrieve graph: ${graphRequest}`;
        globalContext.log(errorMessage);
        throw new Error(errorMessage);
    });
}

function processPage(queryTemplate, graph) {
    for (let i = 0; i < graph.data.organization.repositories.edges.length; i++) {
        let repo = graph.data.organization.repositories.edges[i].node;
        let document = {
            PartitionKey : graph.data.organization.id,
            RowKey : repo.id,
            OrganizationName : graph.data.organization.name,
            RepositoryName : repo.name,
            ResourcePath: repo.resourcePath,
            pushedAt: repo.pushedAt,
            IsFork : repo.isFork,
            Description : repo.description             
        };
        // adding the topics as properties 
        for (let t = 0; t < repo.repositoryTopics.nodes.length; t++) {
            let topicName = `topic_` + repo.repositoryTopics.nodes[t].topic.name.replace(/-/g,`_`);
            document[topicName] = true;
            globalContext.log(topicName);
        }
        globalContext.bindings.githubRepositoriesDocument = JSON.stringify(document);
        globalContext.done();
    }
   
    if (graph.data.organization.repositories.pageInfo.hasNextPage) {
        let afterString = `after:"` + graph.data.organization.repositories.pageInfo.endCursor + `",`
        let queryString = queryTemplate.replace(`PAGINATION_PLACEHOLDER`, afterString);
        executeQuery({query: queryString}, queryTemplate, processPage);
    }
}

function processRepositories(){
    let queryTemplate = `{
        organization(login: ORG_PLACEHOLDER) {
            id
            name
            repositories(first: 10, PAGINATION_PLACEHOLDER orderBy: {field: PUSHED_AT, direction: DESC}) {
            totalCount
            edges {
              node {
                id
                name
                resourcePath  
                pushedAt
                repositoryTopics(first: 50) {
                  nodes {
                     topic {
                      name
                    }
                  }
                }
                isFork
                description
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`
        let orgs = process.env.ORGANIZATIONS.split(`,`);
        for (let o = 0; o < orgs.length; o++ ){
            let queryTemplateOrg = queryTemplate.replace(`ORG_PLACEHOLDER`, `"` + orgs[o] + `"`);
            let queryString = queryTemplateOrg.replace(`PAGINATION_PLACEHOLDER`, ``);
            executeQuery({query: queryString}, queryTemplateOrg, processPage);
        }
}

module.exports = function (context) {
    globalContext = context;

    try{
        globalContext.bindings.githubRepositoriesDocument =  JSON.stringify(globalContext.bindings.githubRepositoriesStep2);
        // processRepositories();
        globalContext.done();
    } catch(error) {
        RaiseException(error, true);
    }
}