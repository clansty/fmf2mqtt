import * as fs from "node:fs";

interface CacheData {
  // preferences
  devices: Device[];
  labels: Label[];
  // config
  contacts: { [id: string]: Contact };
  // following
  // followers
  // myInfo
  // features
  labelledLocations: LabelledLocation[];
}

interface Device {
  id: string;
  name: string;
  autoMeCapable: boolean;
}

interface Label {
  value: string;
}

interface Contact {
  storeHasImage: boolean;
  storeUUID: string;
  displayName: string;
  shortName: string;
}

interface LabelledLocation {
  labelType: string;
  userId: string;
  longitude: number;
  id: string;
  updateTs: number;
  latitude: number;
  label: string;
}

const file = fs.readFileSync("data/FriendCacheData.data", "utf-8");
const cacheData: CacheData = JSON.parse(file);
const avatarsFileList = fs.readdirSync("data/avatars");

export default {
  getContactDisplayNameById(id: string): string {
    return cacheData.contacts[id]?.displayName;
  },
  getAvatarBase64UrlById(id: string): string {
    const avatarFile = avatarsFileList.find((file) => file.includes(id) && file.endsWith("66.0.png"));
    if (avatarFile)
      return `data:image/png;base64,${fs.readFileSync(`data/avatars/${avatarFile}`, "base64")}`;
  }
}
