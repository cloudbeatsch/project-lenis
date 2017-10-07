"use strict";

let util = require('util');
let request = require('request-promise');
let exceptionHelper = require(`../common/exceptions.js`);

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
        try {
            if (result === undefined) {
                next(null, context);
                return;
            }
            context.log(`got response: ${util.inspect(result)}`);
            next(result, context);
            return;
        }
        catch (err) {
            var errorMessage = `Failed processing: ${JSON.stringify(graphRequest)}, error: ${err}`;
            context.log(errorMessage);
            exceptionHelper.raiseException(errorMessage, true, context);
            return;
        }
    })
    .catch(function(err) {
        var errorMessage = `Could not retrieve graph: ${JSON.stringify(graphRequest)}, error: ${err}`;
        context.log(errorMessage);
        exceptionHelper.raiseException(errorMessage, true, context);
        return;
    });
}   

let helper = {
    executeQuery : executeQuery
}
module.exports = helper;