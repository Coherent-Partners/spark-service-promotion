const axios = require('axios');

/**
 * 1. Execute Export API
 * 2. Check status
 * 3. Download files
 *
 * ```bash
 * node -e 'require("./script.js").exp("sit","fieldengineering","<some-token>","[\"folder/service1\",\"folder/service2\"]")'
 * ```
 */
async function exp(env, tenant, token, services) {
  try {
    if (!token || !env || !services || !tenant) {
      throw new ScriptError('required field is missing', 'BAD_REQUEST', 'tenant,token,env,services');
    }

    const endpoint = `https://excel.${env}.coherent.global/${tenant}/api/v4/export`;
    const data = { inputs: { services: sanitizeServices(services) }, source_system: 'GitHub Actions' };

    console.log('endpoint:', endpoint);
    console.log('data:', data);
    console.log('token:', token);

    // const service = await tryExecuteApiService({ endpoint, body: data, token });

    // if (!service.status_url) {
    //   throw new ScriptError('failed to obtain <status_url>', 'UNPROCESSABLE', serviceData);
    // }
    // return await checkStatus({ endpoint: service.status_url, token });
  } catch (error) {
    console.log(error);
    return error instanceof ScriptError ? error.toJson() : { error };
  }
}

async function tryExecuteApiService(resource) {
  try {
    const { endpoint, body, token } = resource;
    const response = await axios.post(endpoint, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data['status_url'];
  } catch (error) {
    ScriptError.handle(error, 'failed to execute Export API');
  }
}

async function checkStatus(resource) {
  const maxRetries = 10;
  try {
    const { endpoint, token } = resource;
    let retries = 0;
    while (retries < maxRetries) {
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data['status'] === 'completed' || response.data['status'] === 'closed') {
        return response.data['outputs']['files'];
      }
      retries++;
      await new Promise((resolve) => setTimeout(resolve, retries * 1000)); // wait n seconds
    }
    return [];
  } catch (error) {
    ScriptError.handle(error, 'failed to check Export status');
  }
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

class ScriptError extends Error {
  constructor(message, type = 'UNKNOWN_ERROR', source) {
    super(message);
    this.type = type;
    this.source = source;
    this.name = 'ScriptError';
  }

  static handle(error, message) {
    if (error instanceof axios.AxiosError) {
      throw new ScriptError(message, 'AXIOS_ERROR', error.message);
    }
    throw new ScriptError(message, 'SERVICE_UNAVAILABLE', error);
  }

  get sourceAsString() {
    if (!this.source) return '<undefined>';
    if (typeof this.source === 'string') return this.source;
    if (this.source instanceof Error) return this.source.message;
    if (typeof this.source === 'object') return '<object>';
    return '<unknown>';
  }

  get hasMessage() {
    return this.message && this.message.trim().length > 0;
  }

  toString() {
    let report = `${this.type} (${this.sourceAsString})`;
    if (this.hasMessage) report = `${report}: ${this.message}`;
    return report;
  }

  toJson() {
    return {
      code: this.type,
      message: this.message,
      origin: this.source,
      details: this.toString(),
    };
  }
}

module.exports = { exp };
