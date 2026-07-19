const errorHandler = require("../errorHandler.middleware");

describe("errorHandler middleware", () => {
  let req, res, next, consoleErrorSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return 400 for ValidationError", () => {
    const err = { name: "ValidationError", message: "Invalid input" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid input" });
  });

  it("should return 404 when message includes 'not found'", () => {
    const err = { message: "Resource not found" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Resource not found" });
  });

  it("should return 404 when message includes 'Task not found'", () => {
    const err = { message: "Task not found" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
  });

  it("should return 400 when message includes 'cannot be in the past'", () => {
    const err = { message: "Due date cannot be in the past" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Due date cannot be in the past" });
  });

  it("should return 400 when message includes 'is required'", () => {
    const err = { message: "Task title is required" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Task title is required" });
  });

  it("should return 403 when message includes 'Unauthorized'", () => {
    const err = { message: "Unauthorized access" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized access" });
  });

  it("should return 403 when message includes 'Forbidden'", () => {
    const err = { message: "Forbidden action" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden action" });
  });

  it("should return 500 for unrecognized errors", () => {
    const err = { message: "Something exploded" };

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should log the error message", () => {
    const err = { message: "Some error" };

    errorHandler(err, req, res, next);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", "Some error");
  });
});
