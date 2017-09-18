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
                               url
                               messageHeadline
                               oid
                               message
                               author {
                                   name
                                   date
                               }
                           }
                       }
                   }
               }
           }
       }
   }
}`;

module.exports = {
    repositoryQuery : REPOSITORY_QUERY
}