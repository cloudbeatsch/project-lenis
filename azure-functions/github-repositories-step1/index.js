`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let organizationQuery = require(`../common/queries/organization.js`).organizationQuery;

function executeOrganizationQuery(organizationName, endCursor, next, context) {
    let variables = JSON.stringify({ 
        end_cursor : endCursor,
        organization_name : organizationName
    });
    gitHubHelper.executeQuery(organizationQuery, variables, next, context);
}

function processOrganizationRepositoryPage(graph, context) {
    for (let i = 0; i < graph.data.organization.repositories.edges.length; i++) {
        let repo = graph.data.organization.repositories.edges[i].node;
        let topics = []
        // adding the topics as properties 
        for (let t = 0; t < repo.repositoryTopics.nodes.length; t++) {
            topics.push(repo.repositoryTopics.nodes[t].topic.name);
        }
        let document = {
            id : graph.data.organization.id + `-` + repo.id,
            organizationId : graph.data.organization.id,
            repositoryId : repo.id,
            organizationName : graph.data.organization.name,
            organizationLogin : graph.data.organization.login,
            repositoryOwner : graph.data.organization.login,
            repositoryName : repo.name,
            resourcePath: repo.resourcePath,
            pushedAt: repo.pushedAt,
            isFork : repo.isFork,
            description : repo.description,
            topics : topics,             
        };
        context.step2Messages.push(document);
    }
   
    if (graph.data.organization.repositories.pageInfo.hasNextPage) {
        executeOrganizationQuery(graph.data.organization.login, graph.data.organization.repositories.pageInfo.endCursor, processOrganizationRepositoryPage, context);
    }
    else {
        context.bindings.githubRepositoriesStep2 = context.step2Messages;
        context.done();
    }
}

function processRepositories(context){
    context[`step2Messages`] = [];
    let orgs = process.env.ORGANIZATIONS.split(`,`);
    for (let o = 0; o < orgs.length; o++ ){
        executeOrganizationQuery(orgs[o], null, processOrganizationRepositoryPage, context);
    }
}

module.exports = function (context) {
    try{
        context.log('Node.js queue trigger function processed work item', context.bindings.myQueueItem);
        processRepositories(context);
    } catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}