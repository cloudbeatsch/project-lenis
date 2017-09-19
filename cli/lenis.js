#!/usr/bin/env node

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