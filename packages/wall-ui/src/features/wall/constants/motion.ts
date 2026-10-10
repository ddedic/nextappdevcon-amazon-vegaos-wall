/**
 * Every animation runs on the native driver on Vega. react-native-web has no native driver
 * and warns when asked for one, so the web build (motion.web.ts) animates in JavaScript.
 */
export const NATIVE_DRIVER = true;
