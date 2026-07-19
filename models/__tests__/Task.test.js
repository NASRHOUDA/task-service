const defineTaskModel = require("../Task");

describe("Task model", () => {
  let capturedHooks;
  let fakeSequelize;

  beforeEach(() => {
    capturedHooks = null;
    fakeSequelize = {
      define: jest.fn((name, attrs, options) => {
        capturedHooks = options.hooks;
        return { name, attrs, options };
      }),
    };
    defineTaskModel(fakeSequelize);
  });

  it("should call sequelize.define with name Task", () => {
    expect(fakeSequelize.define).toHaveBeenCalledWith(
      "Task",
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("beforeUpdate should reset alertSent when status becomes done", () => {
    const task = {
      changed: jest.fn((field) => field === "status"),
      status: "done",
      alertSent: true,
    };

    capturedHooks.beforeUpdate(task);

    expect(task.alertSent).toBe(false);
  });

  it("beforeUpdate should reset alertSent when deadline changes", () => {
    const task = {
      changed: jest.fn((field) => field === "deadline"),
      status: "todo",
      alertSent: true,
    };

    capturedHooks.beforeUpdate(task);

    expect(task.alertSent).toBe(false);
  });

  it("beforeUpdate should not touch alertSent when nothing relevant changes", () => {
    const task = {
      changed: jest.fn(() => false),
      status: "todo",
      alertSent: true,
    };

    capturedHooks.beforeUpdate(task);

    expect(task.alertSent).toBe(true);
  });
});
