# Promotion of Spark Services

This repository contains step-by-step instructions on how to promote Spark services
from one tenant to another.

## Introduction

Deploying Spark services across different environments doesn't follow the same
conventional deployment practices as other software applications. Though possible,
manually exporting and importing services can be time-consuming and error-prone.
Hence, Spark provides a set of APIs known as [ImpEx (Import/Export) API][impex-apis]
to automate this process.

## Methodologies

There are currently two ways to promote Spark services across tenants:

1. Manually download the Spark services from the source tenant and re-upload them to the target tenant.
2. Programatically use the ImpEx API to automate the export and import of Spark services.

This repository focuses on the second methodology, which is more efficient and less error-prone.

Based on the CI/CD platform of your choice, you may implement a promotion workflow that
harnesses the ImpEx API. See examples below:

- [Promotion of Spark Services using GitHub Actions](./docs/GITHUB_ACTIONS.md)
- [Promotion of Spark Services using Azure DevOps](https://docs.coherent.global/spark-apis/impex-apis/how-to-deploy-with-azure-devops "Documented in Coherent Docs")

## Contributing

If you'd like to contribute to this project, please follow the [Contributing Guidelines](./CONTRIBUTING.md).

## Copyright and License

[Apache-2.0](./LICENSE).

<!-- References -->

[impex-apis]: https://docs.coherent.global/api-details/impex-apis
