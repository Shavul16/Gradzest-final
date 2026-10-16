// Express 5 made req.query a read-only getter that parses the URL again on every read. express-mongo-sanitize assigns
// req.query (and edits what it reads), so without this it throws on every request, or its edits are thrown away.
// Making it an ordinary own property that holds the parsed value restores what Express 4 did.
// Mount it before express-mongo-sanitize. See test/expressCompat.test.js.
module.exports = function restoreQuery(req, _res, next) {
  Object.defineProperty(req, 'query', { value: req.query, writable: true, configurable: true, enumerable: true });
  next();
};
