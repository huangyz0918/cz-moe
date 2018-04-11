'format cjs';

var engine = require('./engine');
var conventionalCommitTypes = require('./commit-types');

module.exports = engine({
  types: conventionalCommitTypes.types
});
