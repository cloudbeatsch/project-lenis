"use strict";

let util = require('util');
let request = require('request-promise');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function executeQuery(query, variables, next, context) {
    let graphRequest = {
        query: query,
        variables: variables
    };
    let uri = 'https://api.github.com/graphql';
    let result = request({
        method: 'POST',
        uri,
        headers: {
            'Authorization': 'bearer ' + GITHUB_TOKEN,
            'User-Agent': `project-lenis`
        },
        body : graphRequest, 
        json: true
    }).then(function (result) {
        context.log(`got response: ${util.inspect(result)}`);
        next(result, context);
    })
    .catch(function(err) {
        var errorMessage = `Could not retrieve graph: ${JSON.stringify(graphRequest)}, error: ${err}`;
        context.log(errorMessage);
        throw new Error(errorMessage);
    });
}   

let helper = {
    executeQuery : executeQuery
}
module.exports = helper;