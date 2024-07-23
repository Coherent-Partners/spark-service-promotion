const fs = require('fs');
const { SparkClient: Spark } = require('@cspark/sdk');

const CICD_HANDLER = 'GitHub Actions';
const FILE_PATH = 'package.zip';

/**
 * Export Spark services.
 *
 * ```bash
 * node -e 'require("./script").exp("<settings>", "<bearer-token>")'
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

    console.log(`✅ ${downloadables.length} service(s) exported`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

/**
 * Import Spark services.
 *
 * ```bash
 * node -e 'require("./script.js").imp("<settings>", "<oauth2-creds>")'
 * ```
 */
async function imp(settings, auth) {
  try {
    const { services, ...options } = JSON.parse(settings);
    const spark = new Spark({ ...options, oauth: JSON.parse(auth) });
    const exported = fs.createReadStream(FILE_PATH);

    const response = await spark.impex.import({ file: exported, destination: services, ifPresent: 'add_version' });
    const { outputs } = response.data;
    if (outputs && outputs.services.length === 0) throw 'no services imported';

    console.log(`✅ ${outputs.services.length} service(s) imported`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

module.exports = { imp, exp };
