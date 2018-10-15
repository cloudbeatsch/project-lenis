`use strict`

const REPOSITORY_FRAGMENT = `fragment REPOSITORY_FRAGMENT on RepositoryConnection {
    totalCount
    pageInfo {
        endCursor
        hasNextPage
    }
    edges {
        node {
            id
            name
            owner {
                login
                id
            }
            watchers {
                totalCount
            }
            issues {
                totalCount
            }
            forkCount
            stargazers {
                totalCount
            }
            resourcePath  
            pushedAt
            repositoryTopics(first: 10) {
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
  }`  

module.exports = {
    repositoryFragment : REPOSITORY_FRAGMENT
}