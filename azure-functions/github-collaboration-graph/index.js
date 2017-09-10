"use strict";

let azureStorage = require('azure-storage');
let appInsights = require("applicationinsights");
let appInsightsClient = appInsights.getClient();
let globalContext;

function RaiseException(errorMsg, exit){
    globalContext.log('github-collaboration-graph - error occurred: ' + errorMsg);

    if(appInsightsClient.config){
        appInsightsClient.trackException(new Error(errorMsg));
        if(exit && globalContext){
            globalContext.log("Exiting from error " + errorMsg);
            globalContext.done(errorMsg);
        }
    }else{
        globalContext.log('App Insight is not properly setup. Please make sure APPINSIGHTS_INSTRUMENTATIONKEY is defined');
    }
}

module.exports = function (context, inputMessage) {
    globalContext = context;

    try{

    } catch(error) {
        RaiseException(error, true);
    }
}