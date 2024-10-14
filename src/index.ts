import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel } from '@guiiai/logg'
import mitm from "./mitm";
import mqtt from "./mqtt";
import bluebubbles from "./bluebubbles";
import cron from 'node-cron'

setGlobalLogLevel(LogLevel.Debug)
setGlobalFormat(Format.Pretty)

mitm.start()
mqtt.publishAutoDiscoveryBase()

cron.schedule("*/20 * * * *", bluebubbles.requestRefreshLocations)
