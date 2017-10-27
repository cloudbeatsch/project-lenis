`use strict`

const REPOSITORY_QUERY = `query ($repository_owner:String!, $repository_name:String!, $end_cursor:String ){
    repository( owner : $repository_owner, name : $repository_name) {
       defaultBranchRef {
           target {
               ... on Commit {
                   id
                   history(first: 100, after: $end_cursor) {
                         pageInfo {
                            endCursor
                            hasNextPage
                        }
                        edges {
                           node {
                               committedDate
                               url
                               messageHeadline
                               oid
                               message
                               author {
                                 user {
                                    login
                                    name
                                    location
                                }
                              }
                           }
                       }
                   }
               }
           }
       }
   }
}`;

const COLLABORATED_REPOSITORY_QUERY = `query($login:String!, $end_cursor:String) {
    user(login: $login) {
      contributedRepositories(first: 100, after: $end_cursor) {
        pageInfo {
            endCursor
            hasNextPage
        }
        nodes {
          owner{
            login
          }
        } 
      }
    }
  }`

module.exports = {
    repositoryQuery : REPOSITORY_QUERY,
    collaboratedRepositoryQuery: COLLABORATED_REPOSITORY_QUERY
}