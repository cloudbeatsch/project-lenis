[![To Do](https://badge.waffle.io/cloudbeatsch/project-lenis.svg?label=to%20do&title=to%20do)](http://waffle.io/cloudbeatsch/project-lenis) 
[![In Progress](https://badge.waffle.io/cloudbeatsch/project-lenis.svg?label=in%20progress&title=in%20progress)](http://waffle.io/cloudbeatsch/project-lenis)

# About project-lenis
Provide insight into GitHub users, organizations and repositories using the GitHub 
GraphQL API v4 and PowerBI.

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fcloudbeatsch%2Fproject-lenis%2Fmaster%2Fdeployment%2Fazuredeploy.json" target="_blank">
    <img src="http://azuredeploy.net/deploybutton.png"/>
</a>

<a href="http://armviz.io/#/?load=https%3A%2F%2Fraw.githubusercontent.com%2Fcloudbeatsch%2Fproject-lenis%2Fmaster%2Fdeployment%2Fazuredeploy.json" target="_blank">
    <img src="http://armviz.io/visualizebutton.png"/>
</a>

# Architecture
![Architecture overview](https://raw.githubusercontent.com/cloudbeatsch/project-lenis/master/diagrams/architecture.png)

* Each capability (e.g. the creation of a collaboration graph) is implemented as an independent `nano service`. The output of each `nano service` is written into a document collection of the shared Azure Cosmos DB. Each service implements its own [Power BI template](https://powerbi.microsoft.com/en-us/blog/deep-dive-into-query-parameters-and-power-bi-templates/) to visualize its data.
* The final Power BI report includes the Power BI templates provided by the different `nano services`.
* If a `nano service` requires sequential processing (e.g. extract the key contributors for each repository), the task should be split into multiple functions which are triggered by a queue message.
* AppSettings (e.g. which repositories should be processed/excluded) are set through the `CLI tool`.

# Deploy to Azure
In order to use `project-lenis` the first thing you'll need to do is to deploy the Azure resources to your Azure subscription. Click the `Deploy to Azure` button **(below)** to kick off a deployment.

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fcloudbeatsch%2Fproject-lenis%2Fmaster%2Fdeployment%2Fazuredeploy.json" target="_blank">
    <img src="http://azuredeploy.net/deploybutton.png"/>
</a>

You will be required to provide the following parameters:
* `appName`: A unique identifier for your app deployment
* `githubToken`: A Personal Access Token for GitHub. You can generate one [here](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
* `databaseAccountName`: A unique identifier for your CosmosDB account name
* `organizations`: A comma seperated list of organisations to query against

# Deploy Services Locally
* Install the functions core tools on your local machine if they do not already exist
```
npm i -g azure-functions-core-tools
```
* Navigate to the azure functions directory
```
cd $REPO_ROOT/azure-functions
```
* Install Nodejs dependenices
```
npm install
```
* Create a local settings file if you do not currently have one
```
cp appsettings.json local.settings.json
```
* Check appropriate values are set in your `local.settings.json` file

* Register binding extensions ((see [Register binding extensions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings)))
```
func extensions install
```

* Run the azure functions runtime host
```
func host start --debug vscode
```

* Open the folder `project-lenis` in Visual Studio Code, switch to the Debug view and select `Attach to Azure Functions`
* Open a new terminal and navigate to the `$REPO_ROOT/azure-functions` directory

* Execute the individual functions (v.1 only)
```
func run your-function-name
```

# Custom Nano Service Development Guidance
* Create a new folder within the `azure-functions` directory. Name it the same way as your `nano service` is called (e.g. `github-repositories`). Place all your function files into this folder.
* Name your document collection by using the `nano-service` name followed by the description of the collection itself (e.g. `githubRepositories`)
* Save your Power BI template in the `power-bi` folder. Name the same way as your `nano service` called (e.g. `github-collaboration-graph.pbit`)

# Configuring the PowerBI datasources
Edit the data query and set for each query the datasource to your CosmosDB endpoint. Provide the account key when requested.

# Development Tools
* [Power BI Desktop](https://go.microsoft.com/fwlink/?LinkId=521662&clcid=0x409)
* [Node.js](https://nodejs.org/en/)
* [GitHub GraphQL explorer](https://developer.github.com/v4/explorer/)

# Useful Documentation
* [Azure Functions developers guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference) and the [Azure Functions JavaScript developer guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
* [Code and test Azure functions locally](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
* [Introduction to GraphQL](https://developer.github.com/v4/guides/intro-to-graphql/) and the [GitHub GraphQL schema reference](https://developer.github.com/v4/reference/)
* [Introduction to Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/introduction)
* [Azure Functions Cosmos DB bindings](https://github.com/MicrosoftDocs/azure-docs/blob/master/articles/azure-functions/functions-bindings-documentdb.md)
* [Azure Cosmos DB Node.js SDK](https://docs.microsoft.com/en-us/azure/cosmos-db/documentdb-sdk-node)
* [Power BI templates](https://powerbi.microsoft.com/en-us/blog/deep-dive-into-query-parameters-and-power-bi-templates/)
