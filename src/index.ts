import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel } from '@guiiai/logg'
import mitm from "./mitm";
import mqtt from "./mqtt";

setGlobalLogLevel(LogLevel.Debug)
setGlobalFormat(Format.Pretty)

mitm.start()
mqtt.publishAutoDiscoveryBase()
