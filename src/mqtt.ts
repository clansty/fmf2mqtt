import mqtt from "mqtt";
import { createLogg } from "@guiiai/logg";

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
});

client.on("error", (err) => {
  log.errorWithError("Error", err);
});

const sanitizeId = (notSanitizedId: string) => {
  // filter out non-alphanumeric characters
  return notSanitizedId.replace(/[^a-zA-Z0-9]/g, "");
}

export default {
  publishAutoDiscoveryDeviceTracker(notSanitizedId: string, displayName: string) {
    const id = sanitizeId(notSanitizedId);
    const topic = `homeassistant/device_tracker/${process.env.MQTT_ID}_${id}/config`;
    const payload = {
      name: displayName,
      json_attributes_topic: `${process.env.MQTT_ID}/${id}`,
      unique_id: `${process.env.MQTT_ID}_${id}`,
    };
    client.publish(topic, JSON.stringify(payload), {retain: true});
  },
  publishDeviceTrackerState(notSanitizedId: string, lat: number, lon: number, altitude: number, accuracy: number, locationName: string, isInaccurate: boolean, updateTimestamp: number) {
    const id = sanitizeId(notSanitizedId);
    const topic = `${process.env.MQTT_ID}/${id}`;
    const payload = {
      latitude: lat,
      longitude: lon,
      altitude: altitude,
      gps_accuracy: accuracy,
      state: locationName,
      inaccurate: isInaccurate,
      timestamp: updateTimestamp,
      time: new Date(updateTimestamp).toLocaleString(),
    };
    client.publish(topic, JSON.stringify(payload));
  },
  publishAutoDiscoveryBase() {
    // Last update time sensor
    const topic = `homeassistant/sensor/${process.env.MQTT_ID}_last_update_time/config`;
    const payload = {
      name: "FMF Last Update Time",
      state_topic: `${process.env.MQTT_ID}/last_update_time`,
      device_class: "timestamp",
      value_template: "{{ as_datetime(value) }}",
      unique_id: `${process.env.MQTT_ID}_last_update_time`,
    };
    client.publish(topic, JSON.stringify(payload), {retain: true});
  },
  publishLastUpdateTime() {
    const topic = `${process.env.MQTT_ID}/last_update_time`;
    const payload = new Date().toISOString();
    client.publish(topic, payload);
  },
}