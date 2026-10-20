// expo-crypto is native; Node's implementation gives the same v4 UUIDs.
jest.mock("expo-crypto", () => ({
  randomUUID: () => jest.requireActual("node:crypto").randomUUID(),
}));
