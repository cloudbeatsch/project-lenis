`use strict`;

let exceptionHelper = require(`../common/exceptions.js`);

function processOrganization(context) {
    context[`step1Messages`] = [];
    const orgs = process.env.ORGANIZATIONS.split(',');
    for (let i = 0; i < orgs.length; i++) {
        context.log(`process organization: ` + orgs[i]);
        context.step1Messages.push(orgs[i]);
    }
    context.bindings.githubRepositoriesStep1 = context.step1Messages;
    context.done();
}

module.exports = function (context) {
    try {
        processOrganization(context);
    } catch (error) {
        exceptionHelper.raiseException(error, true, context);
    }
}