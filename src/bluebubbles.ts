import { createLogg } from "@guiiai/logg";

const log = createLogg("BlueBubbles").useGlobalConfig();


export default {
  async requestRefreshLocations() {
    const res = await fetch(`${process.env.BLUEBUBBLES_HOST}/api/v1/icloud/findmy/friends/refresh?password=${process.env.BLUEBUBBLES_PASS}`, {
      method: 'POST',
    });

    log.log("Refresh request sent", res.status);
  }
}
