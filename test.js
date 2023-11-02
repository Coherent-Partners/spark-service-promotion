const impex = require('./script.js');

const TENANT = 'fieldengineering';
const BEARER_TOKEN_SOURCE = `Bearer token here`;
const BEARER_TOKEN_TARGET = `Bearer token here`;
const SERVICES = 'gh_ci_cd/eclm';

(async () => {
  await impex.exp('sit', TENANT, BEARER_TOKEN_SOURCE, SERVICES);
  await impex.imp('uat.us', TENANT, BEARER_TOKEN_TARGET, SERVICES);
})();
