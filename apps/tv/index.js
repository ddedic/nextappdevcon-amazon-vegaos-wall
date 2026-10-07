import { AppRegistry, LogBox } from "react-native";

import { name as appName } from "./app.json";
import { App } from "./src/app/App";

// Vega runtime noise, not app code. Ignore only these exact messages:
// - LogBox's own overlay uses SafeAreaView, whose native view config Vega lacks.
// - Debug builds warn on every start when no Metro server is attached.
LogBox.ignoreLogs([
  "hasViewManagerConfig('RCTSafeAreaView') is not implemented",
  "Running debug build of JavaScript",
]);

AppRegistry.registerComponent(appName, () => App);
