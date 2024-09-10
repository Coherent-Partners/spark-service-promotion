const fs = require('fs');
const { SparkClient: Spark, Logger } = require('@cspark/sdk');

const CICD_HANDLER = 'GitHub Actions';
const FILE_PATH = 'package.zip';
const logger = Logger.of({ logLevels: 'verbose' });

/**
 * Export Spark services.
 *
 * ```bash
 * node -e 'require("./scripts/impex").exp("<settings>", "<bearer-token>")'
 * ```
 */
async function exp(settings, auth) {
  try {
    const { services, ...options } = JSON.parse(settings);
    const spark = new Spark({ ...options, token: auth });
    const downloadables = await spark.impex.export({ services, sourceSystem: CICD_HANDLER });

    if (downloadables.length === 0) throw 'no files to download';
    const file = fs.createWriteStream(FILE_PATH);
    downloadables[0].buffer.pipe(file);

    logger.verbose(`✅ ${downloadables.length} service(s) exported`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

/**
 * Import Spark services.
 *
 * ```bash
 * node -e 'require("./scripts/impex").imp("<settings>", "<oauth-creds>")'
 * ```
 */
async function imp(settings, auth) {
  try {
    const { services: destination, ...options } = JSON.parse(settings);
    const spark = new Spark({ ...options, oauth: JSON.parse(auth) });
    await spark.config.auth.oauth?.retrieveToken(spark.config);

    const file = fs.createReadStream(FILE_PATH);
    const response = await spark.impex.import({ file, destination, ifPresent: 'add_version' });
    const { outputs } = response.data;
    if (!outputs || outputs.services.length === 0) throw 'no services imported';

    logger.verbose(`✅ ${outputs.services.length} service(s) imported`);
    process.exit(0);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

module.exports = { imp, exp };
