import React from "react";
import { Text } from "react-native";
import TestRenderer, { act, type ReactTestRenderer } from "react-test-renderer";

import { wallCopy } from "../../constants/copy";
import { RESTART_AFTER_MS } from "../../constants/timing";
import { WallErrorBoundary } from "./WallErrorBoundary";

let broken = false;
function Flaky() {
  if (broken) throw new Error("boom");
  return <Text>wall</Text>;
}

function mount() {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <WallErrorBoundary>
        <Flaky />
      </WallErrorBoundary>,
    );
  });
  return renderer;
}

const restart = () =>
  act(() => {
    jest.advanceTimersByTime(RESTART_AFTER_MS);
  });

const texts = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map((node) => node.props.children);

describe("WallErrorBoundary", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows the restarting screen, logs the error and remounts the wall", () => {
    broken = true;
    const renderer = mount();

    expect(texts(renderer)).toContain(wallCopy.restarting.title);
    expect(console.error).toHaveBeenCalledWith(
      "Wall crashed, restarting",
      expect.any(Error),
      expect.anything(),
    );

    broken = false;
    restart();
    expect(texts(renderer)).toEqual(["wall"]);
  });

  it("keeps retrying when the wall crashes again on restart", () => {
    broken = true;
    const renderer = mount();
    restart();
    expect(texts(renderer)).toContain(wallCopy.restarting.title);

    broken = false;
    restart();
    expect(texts(renderer)).toEqual(["wall"]);
  });
});
