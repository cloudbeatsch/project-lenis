"use strict";
const gitHubHelper = require(`../common/githubGraphQL.js`);
const exceptionHelper = require(`../common/exceptions.js`);
const organizationUsersQuery = require(`../common/queries/organization.js`).organizationUsersQuery;

function executeOrganizationUsersQuery(orgName, endCursor, next, context){
    const variables = JSON.stringify({
        end_cursor: endCursor,
        organization_name: orgName
    });
    gitHubHelper.executeQuery(organizationUsersQuery, variables, next, context)
}


function processOrganizationUsersPage(graph, context) {
    graph.data.organization.members.nodes.forEach(m => {
        context.logins.push(m.login);
    });
    if (graph.data.organization.members.pageInfo.hasNextPage) {
        executeOrganizationUsersQuery(graph.data.organization.login, graph.data.organization.members.pageInfo.endCursor, processOrganizationUsersPage, context);
    }
    else {
        context.bindings.githubCollabQueue = context.logins;
        context.done();
    }
}

function processOrganizationUsers(context) {
    context.logins = []
    const orgs = process.env.ORGANIZATIONS.split(',');
    orgs.forEach(orgName => executeOrganizationUsersQuery(orgName, null, processOrganizationUsersPage, context))
}

module.exports = function (context, inputMessage) {
    try {
        processOrganizationUsers(context)
    } catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}