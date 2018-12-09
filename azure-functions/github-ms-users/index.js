'use strict'

let gitHubHelper = require(`../common/githubGraphQL.js`);
let exceptionHelper = require(`../common/exceptions.js`);
let msUsersQuery = require(`../common/queries/user.js`).msUsersQuery;

function isMicrosoftOrg(organization) {
  return 
    organization != null &&
    organization != undefined &&
    [ "microsoft", "azure", "azure-samples", "microsoftdocs", "dotnetcore", "dotnet" ].find((v) => v == organization.name.toLowerCase());
}

function processResult(graph, context) {
  let result = context.result;

  var num = 0;
  graph.data.search.nodes.forEach(r => { 
    if ((r.email != null && r.email.toLowerCase().trim().endsWith("@microsoft.com")) ||
        (r.company != null && r.company.toLowerCase().indexOf("microsoft" >= 0)) ||
        (r.organizations != null && r.organizations.nodes != null && r.organizations.nodes.some(isMicrosoftOrg))) {

          var orgName = r.resourcePath;

          if (orgName != null && orgName.length > 1) {
            orgName = orgName.substring(1, orgName.length);

            result.organizations.push( {
              "login": orgName,
              "type": "user",
              "collectionSuffix": "MsUsers"
            });

            delete r.organizations;
            result.msUsers.push(r);

            ++num;
          }
    }
  });

  context.log("Processed page " + context.pageNumber++ + ", found " + num + " entries");

  if (graph.data.search.pageInfo.hasNextPage) {
      executeQuery(graph.data.search.pageInfo.endCursor, context);
  } else {
    context.bindings.githubRepositoriesStep2 = JSON.stringify(result.organizations)
    context.bindings.msUsersDocument = JSON.stringify(result.msUsers);
    context.done();
  }
}

function executeQuery(endCursor, context) {
  const variables = JSON.stringify({
    end_cursor: endCursor,
    page_size: parseInt(process.env.PAGE_SIZE)
  });
  gitHubHelper.executeQuery(msUsersQuery, variables, processResult, context);
}

module.exports = function (context) {
  try{

      context.result = {}
      context.result.organizations = [];
      context.result.msUsers = [];
      context.pageNumber = 0;
      executeQuery(null, context);
  } catch(error) {
      exceptionHelper.raiseException(error, true, context);
  }
}