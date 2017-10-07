"use strict";
const gitHubHelper = require(`../common/githubGraphQL.js`);
const exceptionHelper = require(`../common/exceptions.js`);
const organizationMembersQuery = require(`../common/queries/organization.js`).organizationMembersQuery;

function executeOrganizationMembersQuery(orgName, endCursor, next, context){
    const variables = JSON.stringify({
        end_cursor: endCursor,
        organization_name: orgName
    });
    gitHubHelper.executeQuery(organizationMembersQuery, variables, next, context)
}


function processOrganizationMembersPage(graph, context) {
    graph.data.organization.members.nodes.forEach(m => {
        context.logins.push(m.login);
    });
    if (graph.data.organization.members.pageInfo.hasNextPage) {
        executeOrganizationMembersQuery(graph.data.organization.login, graph.data.organization.members.pageInfo.endCursor, processOrganizationMembersPage, context);
    }
    else {
        context.bindings.githubCollabQueue = context.logins;
        context.done();
    }
}

function processOrganizationMembers(context) {
    context.logins = []
    const orgs = process.env.ORGANIZATIONS.split(',');
    orgs.forEach(orgName => executeOrganizationMembersQuery(orgName, null, processOrganizationMembersPage, context))
}

module.exports = function (context, inputMessage) {
    try {
        processOrganizationMembers(context)
    } catch(error) {
        exceptionHelper.raiseException(error, true, context);
    }
}