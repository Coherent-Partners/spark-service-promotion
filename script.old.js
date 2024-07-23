const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const CICD_HANDLER = 'GitHub Actions';
const FILE_PATH = 'package.zip';
const MAX_RETRIES = 10;

/**
 * 1. Execute Export API
 * 2. Check status
 * 3. Download files
 *
 * ```bash
 * node -e 'require("./script").exp("sit","tenant","<some-token>","[\"folder/service1\",\"folder/service2\"]")'
 * ```
 */
async function exp(env, tenant, token, services) {
  try {
    validateArgs(env, tenant, token, services);

    const endpoint = `https://excel.${env}.coherent.global/${tenant}/api/v4/export`;
    const body = { inputs: { services: sanitizeServices(services) }, source_system: CICD_HANDLER };
    const headers = { headers: { Authorization: token, 'Content-Type': 'application/json' } };

    // 1. Execute Export API
    const response = await executeApiService({ endpoint, body, headers });
    const statusUrl = response && response['status_url'];
    if (isEmpty(statusUrl)) throw new ScriptError('failed to obtain <$.status_url>', 'UNPROCESSABLE', response);

    // 2. Check status
    const outputs = await checkStatus({ endpoint: statusUrl, token });
    if (outputs && outputs.files.length === 0)
      throw new ScriptError('failed to obtain <$.outputs.files>', 'UNPROCESSABLE');

    // 3. Download files
    for (const file of outputs.files) {
      const fileUrl = file['file'];
      if (isEmpty(fileUrl)) continue;

      await downloadFile(fileUrl);
    }
  } catch (error) {
    ScriptError.friendlyMessage(error);
    process.exit(1);
  }
}

/**
 * 1. Execute Import API (Upload zip file)
 * 2. Check status
 *
 * ```bash
 * node -e 'require("./script.js").imp("uat","tenant","<some-token>","[\"folder/service1\",\"folder/service2\"]", "folder/service")'
 * ```
 */
async function imp(env, tenant, token, source, target = '') {
  try {
    validateArgs(env, tenant, token, source);

    const endpoint = `https://excel.${env}.coherent.global/${tenant}/api/v4/import`;
    const formData = createFormData(FILE_PATH, { source, target });
    const headers = { headers: { Authorization: token, ...formData.getHeaders() } };

    // 1. Execute Import API (Upload zip file)
    console.log(`attempt to upload file to ${endpoint}`);
    const response = await executeApiService({ endpoint, body: formData, headers });
    const statusUrl = response && response['status_url'];
    if (isEmpty(statusUrl)) throw new ScriptError('failed to obtain <$.status_url>', 'UNPROCESSABLE', response);

    // 2. Check status
    const outputs = await checkStatus({ endpoint: statusUrl, token });
    if (outputs && outputs.services.length === 0)
      throw new ScriptError('failed to obtain <$.outputs.services>', 'UNPROCESSABLE');
    console.log(`✅ ${outputs.services.length} service(s) imported`);

    process.exit(0);
  } catch (error) {
    ScriptError.friendlyMessage(error);
    process.exit(1);
  }
}

async function executeApiService({ endpoint, body, headers }) {
  try {
    const response = await axios.post(endpoint, body, headers);
    if (response.status !== 200) throw new ScriptError('failed to execute API', 'SERVICE_UNAVAILABLE');
    return response.data;
  } catch (error) {
    ScriptError.handle(error, `failed to POST ${endpoint}`);
  }
}

async function checkStatus({ endpoint, token }) {
  const headers = { headers: { Authorization: token, 'Content-Type': 'application/json' } };

  try {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      const response = await axios.get(endpoint, headers);

      if (response.data['status'] === 'completed' || response.data['status'] === 'closed') {
        return response.data['outputs'];
      }
      retries++;

      console.log(`waiting for Export to complete (attempt ${retries} of ${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, retries * 1000)); // wait n seconds
    }
    return [];
  } catch (error) {
    ScriptError.handle(error, 'failed to check status');
  }
}

async function downloadFile(url) {
  console.log(`attempt to download file from ${url}`);

  const filePath = FILE_PATH;
  const writer = fs.createWriteStream(filePath);

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(writer);
  } catch (error) {
    console.log(`failed to download zip file from ${url}`);
  }

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      const stats = fs.statSync(filePath);
      const size = stats.isFile() ? stats.size : 0;

      console.log(`💪🏼 file of size ${Math.round(size / 1024)}KB downloaded from ${url}`);
      resolve({ filePath, size });
    });

    writer.on('error', (reason) => {
      console.log(`failed to write file onto disk`);

      writer.close();
      reject(reason);
    });
  });
}

function createFormData(filePath, { source, target }) {
  const source_uri = sanitizeServices(source).join(',');
  const target_uri = sanitizeServices(target || source).join(',');
  const metadata = {
    inputs: {
      services_modify: [
        {
          service_uri_source: source_uri,
          service_uri_destination: target_uri,
          update_version_type: 'major',
        },
      ],
    },
    services_existing: 'update',
    source_system: CICD_HANDLER,
  };

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('importRequestEntity', JSON.stringify(metadata));
  return form;
}

function sanitizeServices(services) {
  try {
    if (!services) return [];

    if (typeof services === 'string') {
      if (services.startsWith('[') && services.endsWith(']')) {
        services = JSON.parse(services);
      } else {
        services = [services];
      }
    }
    return services.map((s) => (typeof s === 'string' ? s.trim() : '')).filter((s) => s.length > 0);
  } catch {
    return [];
  }
}

function validateArgs(env, tenant, token, services) {
  if (isEmpty(env)) throw new ScriptError('<env> is required', 'ARGUMENT_MISSING', env);
  if (isEmpty(tenant)) throw new ScriptError('<tenant> is required', 'ARGUMENT_MISSING', tenant);
  if (isEmpty(token)) throw new ScriptError('<token> is required', 'ARGUMENT_MISSING', token);
  if (sanitizeServices(services).length === 0)
    throw new ScriptError('<services> is required', 'ARGUMENT_MISSING', services);
}

function isEmpty(text) {
  return (typeof text === 'string' || text instanceof String) && text.trim().length === 0;
}

class ScriptError extends Error {
  constructor(message, type = 'UNKNOWN_ERROR', cause) {
    super('😩 ' + message);
    this.type = type;
    this.cause = cause;
    this.name = 'ScriptError';
  }

  static handle(error, message) {
    if (error instanceof axios.AxiosError) {
      throw new ScriptError(message, 'AXIOS_ERROR', error.message);
    }
    throw new ScriptError(message, 'SERVICE_UNAVAILABLE', error);
  }

  static friendlyMessage(error, debug = false) {
    if (error instanceof ScriptError || error.name === 'ScriptError') {
      console.log(error.toString());
      if (debug) console.log(error.toJson());
    } else {
      console.log('>>> 😩', error);
    }
  }

  get causeAsString() {
    if (!this.cause) return '<undefined>';
    if (typeof this.cause === 'string') return this.cause;
    if (this.cause instanceof Error) return this.cause.message;
    if (typeof this.cause === 'object') return '<object>';
    return '<unknown>';
  }

  get hasMessage() {
    return this.message && this.message.trim().length > 0;
  }

  toString() {
    let report = `>>> ${this.name} - ${this.type} (${this.causeAsString})`;
    if (this.hasMessage) report = `${report}: ${this.message}`;
    return report;
  }

  toJson() {
    return {
      code: this.type,
      message: this.message,
      origin: this.cause,
      details: this.toString(),
    };
  }
}

module.exports = { imp, exp };
