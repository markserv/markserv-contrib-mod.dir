const Markserv = require('markserv-cli');

Markserv(plugin => {
  return requestPath => {
    return new Promise((resolve, reject) => {

      const result = requestPath;

      // Pass Back to HTTP Request Handler or HTTP Exporter
      const payload = {
        statusCode: 200,
        contentType: 'text/html',
        data: result
      };

      // return payload;
      resolve(payload);
    });
  };
});
