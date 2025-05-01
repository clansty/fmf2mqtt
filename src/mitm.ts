import { Proxy } from "http-mitm-proxy";
import { createLogg } from "@guiiai/logg";
import responseProcessor from "./responseProcessor";
import * as zlib from 'zlib';
import { promisify } from 'util';

const log = createLogg("MITM").useGlobalConfig();
const proxy = new Proxy();
const gunzip = promisify(zlib.gunzip);

proxy.onError(function (ctx, err) {
  log.errorWithError("Error", err);
});

proxy.onResponse(function (ctx, callback) {
  if (ctx.clientToProxyRequest.headers.host.endsWith("fmfmobile.icloud.com") && ctx.clientToProxyRequest.url.endsWith("refreshClient")) {
    const chunks: Buffer[] = [];
    const contentEncoding = ctx.serverToProxyResponse.headers['content-encoding'];

    ctx.onResponseData((ctx, chunk, callback) => {
      chunks.push(chunk);
      return callback(null, chunk);
    });

    ctx.onResponseEnd(async (ctx, callback) => {
      const processBody = (data: string) => {
        responseProcessor.processResponse(data);
      };

      const body = Buffer.concat(chunks);

      try {
        if (contentEncoding === 'gzip') {
          const decompressed = await gunzip(body);
          processBody(decompressed.toString());
        } else {
          processBody(body.toString());
        }
      } catch (err) {
        log.errorWithError("Failed to process response", err);
      } finally {
        callback();
      }
    });
  }
  return callback();
});

export default {
  start: function () {
    proxy.listen({port: 8080, host: '0.0.0.0'});
    log.log("Proxy server started on port 8080");
  },
  stop: function () {
    proxy.close();
    log.log("Proxy server stopped");
  }
}
