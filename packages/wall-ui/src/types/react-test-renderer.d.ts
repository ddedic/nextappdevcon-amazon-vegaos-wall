// react-test-renderer 19 ships no types; just the surface the tests use.
declare module "react-test-renderer" {
  import type { ElementType, ReactElement } from "react";

  export type ReactTestInstance = {
    props: Record<string, unknown>;
    findAllByType(type: ElementType): ReactTestInstance[];
  };
  export type ReactTestRenderer = { root: ReactTestInstance; unmount(): void };

  export function act(callback: () => void): void;
  export function create(element: ReactElement): ReactTestRenderer;

  const TestRenderer: { create: typeof create; act: typeof act };
  export default TestRenderer;
}
