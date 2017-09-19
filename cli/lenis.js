#!/usr/bin/env node

/*
Issue:
What is this for - if just configuring app settings,
then also needs to redeploy function and thus
needs to create app using ARM template to be able to 
do differentia updates

Export existing deployment
https://azure.microsoft.com/en-us/blog/export-template/

Lenis CLI capabilities
- Create deployment
- Authenticate users
- Set appsettings
- Add remove users and orgs
- Fiter tags

Examples:
lenis login "MYCONNECTIONSTRING"  // Sets connectionstring to use for calls
lenis service list // Gets and prints current service configurations
lenis service get <myservicename> // Get specific service configuration
lenis service apply <myservicename> -f appsettings.json // Applies a configuration file to service configuration
SERVICENAME={serialzedconfig}
*/

var program = require('commander');
var profilePath = './profile.json'
var profile = require(profilePath);
var fs = require("fs")

program
  .version('0.0.1')
  .command('login <connectionstring>')
  .description('login using Azure connection string')
  .action((connectionstring) => {
    profile.connectionstring = connectionstring;
    fs.writeFile(profilePath, JSON.stringify(profile, null, 2), function (err) {
      if (err) return console.log(err);
      console.log("Updated profile")
    });
  })

program
  .command('service', 'perform operations on services')

program.parse(process.argv);