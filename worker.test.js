describe("Cloudflare Worker MCP auth", () => {
  test("extracts the bearer token from the authorization header", async () => {
    const { getBearerToken } = require("./worker-auth");
    const request = new Request("https://example.test/mcp", {
      headers: {
        Authorization: "Bearer opensign.test-key",
      },
    });

    expect(getBearerToken(request)).toBe("opensign.test-key");
  });

  test("returns an empty token when authorization is missing", async () => {
    const { getBearerToken } = require("./worker-auth");
    const request = new Request("https://example.test/mcp");

    expect(getBearerToken(request)).toBe("");
  });
});
