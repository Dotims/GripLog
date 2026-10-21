import { readableError } from "./api";

describe("readableError", () => {
  it("hides raw network failures behind one message", () => {
    const android = new TypeError(
      "fetch failed: java.net.ConnectException: Failed to connect to localhost/127.0.0.1:3000",
    );
    expect(readableError(android)).toBe("Can't reach the GripLog server");
    expect(readableError(new TypeError("Network request failed"))).toBe(
      "Can't reach the GripLog server",
    );
  });

  it("keeps messages the server wrote for people", () => {
    expect(readableError(new Error("Invalid email or password"))).toBe("Invalid email or password");
    expect(readableError("User already exists")).toBe("User already exists");
  });

  it("falls back when there is nothing to show", () => {
    expect(readableError(undefined, "Could not sign in")).toBe("Could not sign in");
  });
});
