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

  module.exports = {
    userQuery: USER_QUERY
  }