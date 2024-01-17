# CI/CD Pipeline with GitHub Actions

[![CI/CD build status][ci-img]][ci-url]

This repository contains a CI/CD script implemented using GitHub Actions to export
and import Spark services from a lower to higher environment.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Workflow](#workflow)
  - [Test Workflow](#test-workflow)
  - [ImpEx Workflow](#impex-workflow)
    - [Export](#export)
    - [Import](#import)
  - [Configuration](#configuration)
  - [Customization](#customization)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Welcome to the CI/CD for Exporting and Importing Spark Services repository!

This project leverages GitHub Actions to automate the process of exporting and
importing Spark services, facilitating a seamless deployment from lower to higher
environments.

With a meticulously designed workflow, a CI/CD script may help ensure efficiency
and consistency in managing your Spark services. If you're looking to streamline
and enhance deployment workflows, this repository offers a basic foundation to
accelerate this process.

Explore the comprehensive documentation below to get started on integrating this
sample CI/CD solution into your own environment.

## Prerequisites

Before you start using the ImpEx (Import/Export) workflow, ensure you have the
following prerequisites in place:

- **GitHub Repository**: You should have a GitHub repository set up for your
  project where you'll be implementing the CI/CD workflow.
- **Access to Environments**: You should have access to credentials and permissions
  for the lower environment (e.g., UAT) and higher environment (e.g., PROD) where
  you intend to perform the import and export of Spark services.
- **Environment Variables**: Set up the necessary environment variables in your
  GitHub repository secrets for both the export and import jobs. These include
  `CS_URL_REGION`, `CS_TENANT_NAME`, `CS_BEARER_TOKEN`, `CS_SERVICE_URI_SOURCE`,
  and `CS_SERVICE_URI_TARGET`. These variables will be used for authentication and
  service URI configuration. For more information on how to set up environment
  variables, visit [GitHub Actions Environment Variables][gha-envars].
- **Valid Spark Service Configurations**: Make sure that your Spark service
  configurations are correctly set up in both environments (lower and higher).
  This includes folders and services that you want to export and import.
- **Authorization Tokens**: Obtain a valid authorization token (Bearer token) that
  grants access to your Spark services for both export and import operations.

With these prerequisites in place, you'll be ready to implement and run the ImpEx
workflow for seamless Spark service migration.

> **NOTE**:
>
> If you'd like to test the script locally, ensure that Node.js (version 16 or higher)
> and npm (Node Package Manager) are installed on your development environment.
> Run `npm install` to install the required dependencies and `npm test` to execute
> import and export operations. Remember to set up the necessary environment variables
> in your local environment as well.

## Workflow

The ImpEx (Import/Export) workflow is a comprehensive CI/CD automation orchestrated
through GitHub Actions. This workflow is designed to seamlessly migrate Spark
services between 2 different environments, enhancing deployment efficiency and
maintaining consistency across development stages.

The process starts with an export operation in the SIT environment, where the
latest configurations and services are packaged into a portable artifact. This
artifact is then securely stored for later use. Subsequently, the import workflow
retrieves the exported entities, deploys them in the UAT environment, and ensures
the seamless transition of services from the lower environment to the higher one.

### Test Workflow

If you're new to GitHub Actions, you can test the workflow by running the
`Intro to GitHub Actions` workflow. This workflow is designed to help you get
familiar with GitHub Actions and its associated features.

Visit [GitHub Actions](https://docs.github.com/en/actions/quickstart) to learn
more about GitHub Actions and how to get started.

### ImpEx Workflow

The `ImpEx` workflow is currently configured to work with the SIT and UAT environments.
However, it's important to note that the workflow is designed to be environment-agnostic.

The workflow consists of 2 jobs: `export` and `import`.

#### Export

- **Environment**: SIT
- **Trigger**: Manually triggered using `workflow_dispatch`
- **Steps**:
  1. **Checkout Repository**: Pulls the latest code from the repository.
  2. **Install Node**: Sets up Node.js environment with version 16 and caches npm dependencies.
  3. **Install Node Dependencies**: Installs project dependencies using `npm ci`.
  4. **Execute Export API Request**: Invokes a Node.js script to perform the export operation.
  5. **Persist exported entities as artifact**: Uploads the exported entities as
  an artifact named `exported`.

#### Import

- **Environment**: UAT
- **Trigger**: Automatically triggered after the 'export' job is successful (`needs: export`).
- **Steps**:
  1. **Checkout Repository**: Pulls the latest code from the repository.
  2. **Install Node**: Sets up Node.js environment with version 16 and caches npm dependencies.
  3. **Install Node Dependencies**: Installs project dependencies using `npm ci`.
  4. **Download exported entities from artifact**: Retrieves the exported entities artifact.
  5. **Execute Import API Request**: Invokes a Node.js script to perform the import operation.
  6. **Clean Up**: Deletes the artifact file after import is completed.

### Configuration

- Make sure to set up the necessary environment variables (e.g., `CS_URL_REGION`,
`CS_TENANT_NAME`, `CS_BEARER_TOKEN`, `CS_SERVICE_URI_SOURCE`, `CS_SERVICE_URI_TARGET`)
in your GitHub repository for both export and import jobs.

### Customization

Feel free to customize the workflow, environment settings, or any other parameters
in the workflow file (`.github/workflows/main.yml`) to suit your specific requirements.

Additionally, you can also customize the Node.js script (`src/script.js`) to add
more functionality or modify the existing one. Keep in mind that the script relies
entirely on the [ImpEx APIs][impex-apis] to perform the import and export operations.

> [!IMPORTANT]
> By combining the power of GitHub Actions and a meticulously designed NodeJS script,
> the ImpEx workflow offers a practical solution for managing and deploying Spark
> services with ease and precision.

## Usage

As of now, you can only trigger the pipeline manually. To do so, click on the
`Actions` tab in your GitHub repository and select the `ImpEx` workflow.

1. **Exporting Spark Services**:
   - Manually trigger the export workflow by clicking on the `Run workflow` button in the Actions tab.
   - Once triggered, the workflow will perform the export operation in the SIT environment.

2. **Importing Spark Services**:
   - After the export job is successful, the import workflow will automatically run in the UAT environment.
   - This workflow will first download the exported entities and then perform the import operation.

## Contributing

If you'd like to contribute to this project, please follow the
[Contributing Guidelines](CONTRIBUTING.md).

## License

This project is licensed under [MIT](LICENSE).

<!-- References -->
[ci-img]: https://github.com/CoherentCapital/gha-ci-cd/workflows/impex/badge.svg
[ci-url]: https://github.com/coherentCapital/gha-ci-cd/actions/workflows/main.yml
[gha-envars]: https://docs.github.com/en/actions/learn-github-actions/variables
[impex-apis]: https://docs.coherent.global/api-details/impex-apis
