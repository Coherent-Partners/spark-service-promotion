const impex = require('./impex.js');

const UAT_SPARK_SETTINGS =
  '{"env":"uat.us","tenant":"my-tenant","timeout":90000,"maxRetries":20,"retryInterval":3,"services":["source-folder/my-service"]}';
const UAT_BEARER_TOKEN = 'uat bearer token';

const PROD_SPARK_SETTINGS =
  '{"env":"us","tenant":"my-tenant","timeout":90000,"maxRetries":40,"retryInterval":3,"services":{"source":"source-folder/my-service","target":"target-folder/my-service"}}';
const PROD_OAUTH_CREDS = '{"clientId":"my-clientId","clientSecret":"my-client-secret"}';

(async () => {
  await impex.exp(UAT_SPARK_SETTINGS, UAT_BEARER_TOKEN);
  await impex.imp(PROD_SPARK_SETTINGS, PROD_OAUTH_CREDS);
})();
