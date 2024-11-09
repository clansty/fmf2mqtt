import mqtt from "mqtt";
import { createLogg } from "@guiiai/logg";
import bluebubbles from "./bluebubbles";

const log = createLogg("MQTT").useGlobalConfig();

const client = mqtt.connect(process.env.MQTT_URL, {
  clientId: process.env.MQTT_ID,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  log.log("Connected");

  client.subscribe(`${process.env.MQTT_ID}/refresh`);
});

client.on("error", (err) => {
  log.errorWithError("Error", err);
});

client.on('message', (topic, message) => {
  if (topic === `${process.env.MQTT_ID}/refresh`) {
    log.log("Received refresh command");
    bluebubbles.requestRefreshLocations();
  }
});

const sanitizeId = (notSanitizedId: string) => {
  // filter out non-alphanumeric characters
  return notSanitizedId.replace(/[^a-zA-Z0-9]/g, "");
}

export default {
  publishAutoDiscoveryDeviceTracker(notSanitizedId: string, displayName: string, pictureUrl?: string) {
    const id = sanitizeId(notSanitizedId);
    const topic = `homeassistant/device_tracker/${process.env.MQTT_ID}_${id}/config`;
    const payload = {
      name: displayName,
      json_attributes_topic: `${process.env.MQTT_ID}/${id}`,
      unique_id: `${process.env.MQTT_ID}_${id}`,
      // invalid url for dictionary value @ data['entity_picture']'
      // entity_picture: pictureUrl,
      state_topic: `${process.env.MQTT_ID}/${id}/state`,
      payload_home: '_$!<home>!$_',
      device: {
        identifiers: `FMF_${process.env.MQTT_ID}`,
        name: "Find My Friends",
      }
    };
    client.publish(topic, JSON.stringify(payload), {retain: true});
  },
  publishDeviceTrackerState(notSanitizedId: string, lat: number, lon: number, altitude: number, accuracy: number, locationName: string, isInaccurate: boolean, updateTimestamp: number, label: string, address: string, avatarUrl?: string) {
    const id = sanitizeId(notSanitizedId);
    const topic = `${process.env.MQTT_ID}/${id}`;
    const payload = {
      latitude: lat,
      longitude: lon,
      altitude,
      gps_accuracy: accuracy,
      state: locationName,
      inaccurate: isInaccurate,
      timestamp: updateTimestamp,
      time: new Date(updateTimestamp).toLocaleString(),
      label2: label,
      address,
      // temp fix https://github.com/home-assistant/core/issues/128370
      entity_picture2: avatarUrl,
    };
    client.publish(topic, JSON.stringify(payload));
    client.publish(`${topic}/state`, locationName);
  },
  publishAutoDiscoveryBase() {
    // Last update time sensor
    {
      const topic = `homeassistant/sensor/${process.env.MQTT_ID}_last_update_time/config`;
      const payload = {
        name: "FMF Last Update Time",
        state_topic: `${process.env.MQTT_ID}/last_update_time`,
        device_class: "timestamp",
        value_template: "{{ as_datetime(value) }}",
        unique_id: `${process.env.MQTT_ID}_last_update_time`,
      };
      client.publish(topic, JSON.stringify(payload), {retain: true});
    }
    // Refresh button
    {
      const topic = `homeassistant/button/${process.env.MQTT_ID}_refresh/config`;
      const payload = {
        name: "FMF Refresh",
        command_topic: `${process.env.MQTT_ID}/refresh`,
        unique_id: `${process.env.MQTT_ID}_refresh`,
      };
      client.publish(topic, JSON.stringify(payload), {retain: true});
    }
  },
  publishLastUpdateTime() {
    const topic = `${process.env.MQTT_ID}/last_update_time`;
    const payload = new Date().toISOString();
    client.publish(topic, payload);
  },
}
