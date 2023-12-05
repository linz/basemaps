import fs from 'fs';
import http from 'http';
import path from 'path';

/**
 * Very basic http server that redirects all 404's back to index.html
 * as basemaps uses `/@location` for its main page these `/@*` has to be served with `index.html`
 */
const srv = http.createServer(function (request, response) {
  const target = path.join('dist', request.url);
  const stat = fs.existsSync(target);
  if (!request.url.endsWith('/') && stat) {
    fs.createReadStream(target, {
      bufferSize: 4 * 1024,
    }).pipe(response);
    return;
  }
  fs.createReadStream('dist/index.html', {
    bufferSize: 4 * 1024,
  }).pipe(response);
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
srv.listen(port, () => {
  process.stdout.write(`listening.. http://localhost:${port}\n`);
});
