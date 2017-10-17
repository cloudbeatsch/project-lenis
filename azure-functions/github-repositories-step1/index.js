`use strict`;

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let organizationMembersQuery = require(`../common/queries/organization.js`).organizationMembersQuery;

function executeMembersQuery(organizationName, endCursor, next, context) {
    let variables = JSON.stringify({
        end_cursor: endCursor,
        organization_name: organizationName
    });
    gitHubHelper.executeQuery(organizationMembersQuery, variables, next, context);
}

function processMembersPage(graph, context) {
    if (!graph || !graph.data || !graph.data.organization || !graph.data.organization.members) {
        context.bindings.githubRepositoriesStep2 = context.step2Messages;
        context.done();
        return;
    }

    for (let i = 0; i < graph.data.organization.members.nodes.length; i++) {
        context.step2Messages.push(JSON.stringify({ login: graph.data.organization.members.nodes[i].login, type : "user"}));
    }

    if (graph.data.organization.members.pageInfo.hasNextPage) {
        // to not being flagged as abused we wait 10 seconds before executing the next query
        context.log(`Wait 10 seconds before continuing query GitHub`);
        setTimeout(function() {
            executeOrganizationQuery(graph.data.organization.login, graph.data.organization.members.pageInfo.endCursor, processMembersPage, context);
        }, 10000);
    }
    else {
        context.bindings.githubRepositoriesStep2 = context.step2Messages;
        context.done();
        return;
    }
}

function processOrganization(org, context){
    context[`step2Messages`] = [];
    context.log(`process organization: ` + org);
    context.step2Messages.push(JSON.stringify({ login: org, type : "organization"}));
    executeMembersQuery(org, null, processMembersPage, context);
}

module.exports = function (context) {
    try {
        processOrganization(context.bindings.githubRepositoriesStep1, context);
    } catch (error) {
        exceptionHelper.raiseException(error, true, context);
    }
}