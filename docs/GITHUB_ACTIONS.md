# Promotion of Spark Services using GitHub Actions

This guide contains instructions on how to promote Spark services from one tenant
to another using GitHub Actions.

## Prerequisites

To get started, make sure to set up the following:

- **GitHub repository**: where the promotion workflow will be implemented.
- **Spark settings**: collect the Spark settings for both the source and target
  tenants. These settings should include necessary parameters (e.g., service URIs)
  a valid authorization scheme for the export and import jobs.

You may want to store these values as environment variables. For more information
on how to set up environment variables, visit [GitHub Actions Environment Variables][gha-env-vars].

The `SPARK_SETTINGS` and `BEARER_TOKEN` environment variables were chosen as a
dynamic way to provide these details to the workflow. You are welcome to choose a
different approach as you see fit.

## Workflow

### Test Workflow

If you're new to GitHub Actions, you can test the workflow concept by running the
`Intro to GitHub Actions` workflow, which is designed to help you get started with
GitHub Actions and its associated features.

Visit [GitHub Actions](https://docs.github.com/en/actions/quickstart) to learn
more about it.

### Promotion Workflow

The `Promotion` workflow is built on top of the [Coherent Spark SDK][ts-sdk], which
provides convenient ways to interact with the Spark ImpEx API within a Node.js environment.

The workflow consists of 2 codependent jobs: `export` and `import`.

- `export` is responsible for exporting Spark services from the source
  tenant. It triggers the export operation using the [Export API][export-api],
  polls its status until completion, and downloads the exported entities as an artifact.

- `import` is triggered automatically after the `export` job is successful.
  It uses the exported entities from the artifact to perform the import operation
  in the target tenant.

### Configuration

To demonstrate the promotion workflow in this example, we use 2 repo environments:
SIT (source) and UAT (target) with their respective Spark settings and bearer tokens.

- The `SPARK_SETTINGS` is a stringified object compliant with the SDK client configuration.
  For example, the settings for the source tenant (SIT) can be defined as follows:

```json
{
  "env": "sit",
  "tenant": "tenant-name",
  "timeout": 60000,
  "maxRetries": 10,
  "retryInterval": 3,
  "services": ["folder-name/service-name"]
}
```

- The `BEARER_TOKEN` is a valid authorization token for the Spark API. Other authorization
schemes like API keys or OAuth2 client credentials can be used as well.

> [!NOTE]
>
> If you'd like to test the scripts locally, ensure that Node.js (version 16+)
> and npm (Node Package Manager) are installed on your machine.
> Run `npm install` to install the required dependencies and `node scripts/test.js`
> to execute the test script. Remember to update the environment variables to match
> your Spark settings and bearer token.

### Customization

Feel free to customize the workflow, environment settings, or any other parameters
in the workflow file (`.github/workflows/main.yml`) to suit your specific requirements.

Additionally, you can also customize the Node.js script [`scripts/impex.js`](../scripts/impex.js)
to add more functionality or modify the existing one. Keep in mind that the script relies
entirely on the [ImpEx APIs][impex-apis] to perform the import and export operations.

To manually trigger the pipeline, click on the `Actions` tab in your GitHub repository
and select the `Promotion` workflow.

[gha-env-vars]: https://docs.github.com/en/actions/learn-github-actions/variables
[impex-apis]: https://docs.coherent.global/api-details/impex-apis
[export-api]: https://docs.coherent.global/spark-apis/impex-apis/export
[ts-sdk]: https://www.npmjs.com/package/@cspark/sdk
