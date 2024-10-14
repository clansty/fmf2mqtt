import { Proxy } from "http-mitm-proxy";
import { createLogg } from "@guiiai/logg";
import responseProcessor from "./responseProcessor";

const log = createLogg("MITM").useGlobalConfig();
const proxy = new Proxy();

proxy.onError(function (ctx, err) {
  log.errorWithError("Error", err);
});

proxy.onResponse(function (ctx, callback) {
  log.withFields({
    host: ctx.clientToProxyRequest.headers.host,
    url: ctx.clientToProxyRequest.url,
    statusCode: ctx.serverToProxyResponse.statusCode,
  }).debug('RESPONSE END');
  if (ctx.clientToProxyRequest.headers.host.endsWith("fmfmobile.icloud.com") && ctx.clientToProxyRequest.url.endsWith("refreshClient")) {
    let body = '';
    ctx.onResponseData((ctx, chunk, callback) => {
      body += chunk.toString();
      return callback(null, chunk);
    });
    ctx.onResponseEnd((ctx, callback) => {
      responseProcessor.processResponse(body);
      return callback();
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
