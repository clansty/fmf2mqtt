import { createLogg } from "@guiiai/logg";
import cacheData from "./cacheData";
import mqtt from "./mqtt";

const log = createLogg("responseProcessor").useGlobalConfig();

interface Location {
  altitude: number
  isInaccurate: boolean
  address: Address
  locSource: any
  secureLocation: any
  secureLocationTs: number
  latitude: number
  shortAddress: any
  floorLevel: number
  horizontalAccuracy: number
  labels?: Label[]
  tempLangForAddrAndPremises: any
  verticalAccuracy: number
  batteryStatus: any
  locationId: string
  fullAddress: any
  locationTimestamp: number
  locationMode: any
  longitude: number
  timestamp: number
}

interface Label {
  info?: string
  type: string
  label: string
  id?: string
  latitude?: number
  longitude?: number
}

interface Address {
  formattedAddressLines?: string[]
  country: string
  streetName?: string
  streetAddress?: string
  countryCode: string
  locality?: string
  stateCode?: string
  administrativeArea: string
}

interface LocationEntry {
  location?: Location
  id: string
}

const lastUpdateMap = new Map<string, number>();

const processLocation = async (entry: LocationEntry) => {
  const recordedLastUpdate = lastUpdateMap.get(entry.id);
  if (recordedLastUpdate && recordedLastUpdate >= entry.location.timestamp) {
    log.debug("Location already processed");
    return;
  }
  const person = cacheData.getContactDisplayNameById(entry.id);
  const label = entry.location.labels?.find(label => label.label)?.label;

  if (!recordedLastUpdate) {
    mqtt.publishAutoDiscoveryDeviceTracker(entry.id, person);
  }
  lastUpdateMap.set(entry.id, entry.location.timestamp);

  log.withFields({
    person, label,
    lat: entry.location.latitude,
    lng: entry.location.longitude,
    address: entry.location.address?.formattedAddressLines?.join(", "),
    timestamp: new Date(entry.location.timestamp),
  }).log("Location received");

  mqtt.publishDeviceTrackerState(
    entry.id,
    entry.location.latitude,
    entry.location.longitude,
    entry.location.altitude,
    entry.location.horizontalAccuracy,
    label || entry.location.address?.formattedAddressLines?.join(", ") || "Unknown",
    entry.location.isInaccurate,
    entry.location.timestamp
  );
}

export default {
  async processResponse(response: string) {
    let data: any;
    try {
      data = JSON.parse(response);
    } catch (e) {
      log.errorWithError("Error parsing response", e);
      return;
    }

    if (!Array.isArray(data.locations)) {
      log.warn("No locations array found in response");
      return;
    }

    log.withField('length', data.locations.length).debug("Processing response");
    for (let locationEntry of data.locations as LocationEntry[]) {
      if (!locationEntry.location) {
        continue;
      }
      processLocation(locationEntry);
    }
    mqtt.publishLastUpdateTime();
  }
}
