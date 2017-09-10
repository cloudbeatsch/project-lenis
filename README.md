[![To Do](https://badge.waffle.io/cloudbeatsch/project-lenis.svg?label=to%20do&title=to%20do)](http://waffle.io/cloudbeatsch/project-lenis) 
[![In Progress](https://badge.waffle.io/cloudbeatsch/project-lenis.svg?label=in%20progress&title=in%20progress)](http://waffle.io/cloudbeatsch/project-lenis)

# About project-lenis
Provide insight into GitHub users, organizations and repositories using the GitHub 
GraphQL API v4 and PowerBI.

`project-lenis` wants to provide deep insight into the many different OSS projects within and across GitHub organizations by implementing the ability to visualize and analyze key metrics across users, repositories and organizations.

# Architecture
![Architecture overview](https://raw.githubusercontent.com/cloudbeatsch/project-lenis/master/diagrams/architecture.png)

* Each capability (e.g. the creation of a collaboration graph) is implemented as an independent `nano service`. The output of each `nano service` is written into Azure tables. Each service implements its own [Power BI template](https://powerbi.microsoft.com/en-us/blog/deep-dive-into-query-parameters-and-power-bi-templates/) to visualize its data.
* The final Power BI report includes the Power BI templates provided by the different `nano services`.
* If a `nano service` requires sequential processing (e.g. extract the key contributors for each repository), the task should be split into multiple functions which are triggered by a queue message.
* AppSettings (e.g. which repositories should be processed/excluded) are set through the `CLI tool`.

# Development tools
* [Power BI Desktop](https://go.microsoft.com/fwlink/?LinkId=521662&clcid=0x409)
* [Node.js](https://nodejs.org/en/)
