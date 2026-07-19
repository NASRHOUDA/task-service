const internalAuth = require("../internalAuth.middleware");

describe("internalAuth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.INTERNAL_API_KEY = "secret-key-123";
  });

  it("should return 403 if the key header is missing", () => {
    internalAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden: invalid internal API key" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if the key is wrong", () => {
    req.headers["x-internal-api-key"] = "wrong-key";

    internalAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden: invalid internal API key" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if the key is correct", () => {
    req.headers["x-internal-api-key"] = "secret-key-123";

    internalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
