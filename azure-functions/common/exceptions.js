`use strict`;

let appInsights = require(`applicationinsights`);
let appInsightsClient = appInsights.getClient();

function raiseException(errorMsg, exit, context){
    context.log.error('Error occurred: ' + errorMsg);

    if(appInsightsClient.config){
        appInsightsClient.trackException(new Error(errorMsg));
    } 
    else {
        context.log.error('App Insight is not properly setup. Please make sure APPINSIGHTS_INSTRUMENTATIONKEY is defined');
    }
    if(exit && context){
        context.log("Exiting from error " + errorMsg);
        context.done(errorMsg);
    }
}   

let helper = {
    raiseException : raiseException
}
module.exports = helper;