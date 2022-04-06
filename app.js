// Read config
var configSchema = require('./config.schema');
var getenv = require('getenv');

var config = {};
try {
  config = require('./config');
} catch (err) {
  console.log('no config file found');
}

readEnvironmentVariables(configSchema, config);

var validate = require('jsonschema').validate;
var result = validate(config, configSchema);

if (result.errors.length > 0) {
  console.log('Config file invalid', result);
  process.exit(1);
}

var groupSync = new require('./groupSync')(config);
groupSync.sync();

// Helper functions
function readEnvironmentVariables(schema, conf, prefix = '') {
  getenv.enableErrors();
  for (property in schema.properties) {
    var envKey = (prefix + property).toUpperCase().replace('.', '_');
    try {
      if (schema.properties[property].type === 'object') {
        var subConf = conf[property] || {};
        conf[property] = subConf;
        readEnvironmentVariables(schema.properties[property], subConf, prefix + property + '.');
      } else if (schema.properties[property].type === 'string') {
        conf[property] = getenv(envKey);
      } else if (schema.properties[property].type === 'integer') {
        conf[property] = getenv.int(envKey);
      } else {
        console.log('unsupported type', schema.properties[property].type);
      }
    } catch (e) { }
  }
}
