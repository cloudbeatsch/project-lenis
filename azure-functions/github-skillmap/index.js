module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if(myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    // Execute Graph Query to get the list of repos
    
    
    context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    context.done();
};