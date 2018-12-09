`use strict`
let repositoryFragment = require(`./fragments/repository.js`).repositoryFragment;

const USER_QUERY = `query ($user_login:String!, $end_cursor:String){
    user(login: $user_login) {
        id
        login
        name
        location
        repositories(first: 10, after: $end_cursor orderBy: {field: PUSHED_AT, direction: DESC}) {
        ... REPOSITORY_FRAGMENT
      }
    }
  }` + repositoryFragment;

  const MS_USERS_QUERY = `query ($end_cursor:String, $page_size: Int!){
    search(query:"microsoft", type:USER, after:$end_cursor, first: $page_size) { 
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on User { 
         id
         name 
         email
         company
         resourcePath
         
         organizations(first: $page_size) { 
             nodes { 
               name 
             } 
          }
        }
      } 
    }
  }`;

  module.exports = {
    userQuery: USER_QUERY,
    msUsersQuery: MS_USERS_QUERY
  }