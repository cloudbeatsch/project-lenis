"use strict";

let util = require('util');
let azureStorage = require('azure-storage');
let appInsights = require("applicationinsights");
let request = require('request-promise');
let appInsightsClient = appInsights.getClient();
let globalContext;



const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_TABLE = 'githubRepositories';
let tableService = azureStorage.createTableService(process.env.AzureWebJobsStorage);
let entGen = azureStorage.TableUtilities.entityGenerator;

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
    let batch = new azureStorage.TableBatch();
    for (let i = 0; i < graph.data.organization.repositories.edges.length; i++) {
        let repo = graph.data.organization.repositories.edges[i].node;
        let tableEntry = {
            PartitionKey : entGen.String(graph.data.organization.id),
            RowKey : entGen.String(repo.id),
            OrganizationName : entGen.String(graph.data.organization.name),
            RepositoryName : entGen.String(repo.name),
            ResourcePath: entGen.String(repo.resourcePath),
            pushedAt: entGen.String(repo.pushedAt),
            IsFork : entGen.Boolean(repo.isFork),
            Description : entGen.String(repo.description)             
        };
        // adding the topics as properties 
        for (let t = 0; t < repo.repositoryTopics.nodes.length; t++) {
            let topicName = `topic_` + repo.repositoryTopics.nodes[t].topic.name.replace(/-/g,`_`);
            tableEntry[topicName] = entGen.Boolean(true);
            globalContext.log(topicName);
        }
        batch.insertOrReplaceEntity(tableEntry);
    }
   
    tableService.executeBatch(REPO_TABLE, batch, function (error, result, response) {
        if(error){
            globalContext.log(`Couldn't save page in organization ` + graph.data.organization.name);
        }
    });       

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

module.exports = function (context, inputMessage) {
    globalContext = context;

    try{
 
        tableService.createTableIfNotExists(REPO_TABLE, (error, result, response) => {
            if(!error){
                processRepositories();
            }
        });
        globalContext.done();
    } catch(error) {
        RaiseException(error, true);
    }
}