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

module.exports = {
    organizationQuery : ORGANIZATION_QUERY
}