`use strict`;

let appInsights = require(`applicationinsights`);
let appInsightsClient = appInsights.getClient();

function raiseException(errorMsg, exit, context){
    context.log('github-repositories error occurred: ' + errorMsg);

    if(appInsightsClient.config){
        appInsightsClient.trackException(new Error(errorMsg));
        if(exit && context){
            context.log("Exiting from error " + errorMsg);
            context.done(errorMsg);
        }
    }else{
        context.log('App Insight is not properly setup. Please make sure APPINSIGHTS_INSTRUMENTATIONKEY is defined');
    }
}   

let helper = {
    raiseException : raiseException
}
module.exports = helper;