`use strict`
let repositoryFragment = require(`./fragments/repository.js`).repositoryFragment;

const ORGANIZATION_QUERY = `query ($organization_name:String!, $end_cursor:String){
    organization(login: $organization_name) {
        id
        login
        name
        repositories(first: 10, after: $end_cursor orderBy: {field: PUSHED_AT, direction: DESC}) {
        ... REPOSITORY_FRAGMENT
      }
    }
  }` + repositoryFragment;

const ORGANIZATION_USERS_QUERY = `query($organization_name:String!, $end_cursor:String) {
    organization(login: $organization_name) {
      members(first: 100, after: $end_cursor) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          login
        }
      }
    }
  }`

  const ORGANIZATION_USERS_REPOS_QUERY = `query($organization_name:String!, $end_members_cursor:String, $end_repos_cursor:String) {
    organization(login: $organization_name) {
      members(first: 10, after: $end_members_cursor) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          login
          repositories(first: 10, after: $end_repos_cursor orderBy: {field: PUSHED_AT, direction: DESC}) {
            ... REPOSITORY_FRAGMENT
          }
        }
      }
    }
  }`

module.exports = {
  organizationQuery: ORGANIZATION_QUERY,
  organizationUsersQuery: ORGANIZATION_USERS_QUERY
}



