const impex = require('./script.js');

const SIT_SPARK_SETTINGS =
  '{"env": "sit","tenant": "coherent","timeout": 90000,"maxRetries": 20,"retryInterval": 3,"services": ["promotions/CyberRater"]}';
const UAT_SPARK_SETTINGS =
  '{"env":"uat.us","tenant":"fieldengineering","timeout":90000,"maxRetries":40,"retryInterval":3,"services":{"source":"promotions/CyberRater","target":"my-folder-1/CyberRater"}}';
const SIT_BEARER_TOKEN = 'sit bearer token';
const UAT_BEARER_TOKEN = 'uat bearer token';

(async () => {
  await impex.exp(SIT_SPARK_SETTINGS, SIT_BEARER_TOKEN);
  await impex.imp(UAT_SPARK_SETTINGS, UAT_BEARER_TOKEN);
})();
