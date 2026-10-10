// Types for the image imports in @boothwall/wall-ui, which this app compiles from source.
declare module "*.png" {
  import type { ImageSourcePropType } from "react-native";
  const source: ImageSourcePropType;
  export default source;
}

declare module "*.jpg" {
  import type { ImageSourcePropType } from "react-native";
  const source: ImageSourcePropType;
  export default source;
}
