import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel } from '@guiiai/logg'
import mitm from "./mitm";

setGlobalLogLevel(LogLevel.Debug)
setGlobalFormat(Format.Pretty)

mitm.start()
