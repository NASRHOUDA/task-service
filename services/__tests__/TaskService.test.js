const TaskRepository = require("../../repositories/TaskRepository");
const TaskService = require("../TaskService");

jest.mock("../../repositories/TaskRepository");

describe("TaskService", () => {
  const userId = "user-1";
  const taskId = "task-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a task successfully with trimmed title/description", async () => {
      const data = { title: "  My Task  ", description: "  desc  ", priority: "high", deadline: null };
      TaskRepository.create.mockResolvedValueOnce({ id: taskId, ...data });

      const result = await TaskService.createTask(userId, data);

      expect(TaskRepository.create).toHaveBeenCalledWith({
        userId,
        title: "My Task",
        description: "desc",
        priority: "high",
        deadline: null,
        status: "todo",
      });
      expect(result).toEqual({ id: taskId, ...data });
    });

    it("should default priority to medium and description to null when missing", async () => {
      const data = { title: "Task" };
      TaskRepository.create.mockResolvedValueOnce({ id: taskId });

      await TaskService.createTask(userId, data);

      expect(TaskRepository.create).toHaveBeenCalledWith({
        userId,
        title: "Task",
        description: null,
        priority: "medium",
        deadline: null,
        status: "todo",
      });
    });

    it("should throw if title is missing", async () => {
      await expect(TaskService.createTask(userId, {})).rejects.toThrow("Task title is required");
      expect(TaskRepository.create).not.toHaveBeenCalled();
    });

    it("should throw if title is empty after trim", async () => {
      await expect(TaskService.createTask(userId, { title: "   " })).rejects.toThrow(
        "Task title is required"
      );
    });

    it("should throw if deadline is in the past", async () => {
      const pastDate = new Date(Date.now() - 100000).toISOString();
      await expect(
        TaskService.createTask(userId, { title: "Task", deadline: pastDate })
      ).rejects.toThrow("Due date cannot be in the past");
      expect(TaskRepository.create).not.toHaveBeenCalled();
    });

    it("should allow a future deadline", async () => {
      const futureDate = new Date(Date.now() + 100000).toISOString();
      TaskRepository.create.mockResolvedValueOnce({ id: taskId });

      await TaskService.createTask(userId, { title: "Task", deadline: futureDate });

      expect(TaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: futureDate })
      );
    });
  });

  describe("getTasks", () => {
    it("should return tasks for a user with filters", async () => {
      const filters = { status: "todo" };
      TaskRepository.findByUserId.mockResolvedValueOnce([{ id: taskId }]);

      const result = await TaskService.getTasks(userId, filters);

      expect(TaskRepository.findByUserId).toHaveBeenCalledWith(userId, filters);
      expect(result).toEqual([{ id: taskId }]);
    });
  });

  describe("getTaskById", () => {
    it("should return the task if found", async () => {
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId });

      const result = await TaskService.getTaskById(userId, taskId);

      expect(TaskRepository.findById).toHaveBeenCalledWith(taskId, userId);
      expect(result).toEqual({ id: taskId });
    });

    it("should throw if task not found", async () => {
      TaskRepository.findById.mockResolvedValueOnce(null);

      await expect(TaskService.getTaskById(userId, taskId)).rejects.toThrow("Task not found");
    });
  });

  describe("updateTask", () => {
    it("should throw if task not found", async () => {
      TaskRepository.findById.mockResolvedValueOnce(null);

      await expect(TaskService.updateTask(userId, taskId, { title: "New" })).rejects.toThrow(
        "Task not found"
      );
      expect(TaskRepository.update).not.toHaveBeenCalled();
    });

    it("should update title, description, status, priority when provided", async () => {
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: null });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await TaskService.updateTask(userId, taskId, {
        title: "  New Title  ",
        description: "  New Desc  ",
        status: "done",
        priority: "low",
      });

      expect(TaskRepository.update).toHaveBeenCalledWith(taskId, userId, {
        title: "New Title",
        description: "New Desc",
        status: "done",
        priority: "low",
      });
    });

    it("should ignore invalid status and priority values", async () => {
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: null });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await TaskService.updateTask(userId, taskId, {
        status: "bogus",
        priority: "extreme",
      });

      expect(TaskRepository.update).toHaveBeenCalledWith(taskId, userId, {});
    });

    it("should set description to null if explicitly cleared", async () => {
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: null });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await TaskService.updateTask(userId, taskId, { description: "" });

      expect(TaskRepository.update).toHaveBeenCalledWith(taskId, userId, { description: null });
    });

    // --- deadlineChanged coverage: the bug fix ---

    it("should NOT revalidate deadline if it is not included in the update", async () => {
      const pastDeadline = new Date(Date.now() - 100000).toISOString();
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: pastDeadline });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await expect(
        TaskService.updateTask(userId, taskId, { title: "New Title" })
      ).resolves.toEqual({ id: taskId });

      expect(TaskRepository.update).toHaveBeenCalledWith(taskId, userId, { title: "New Title" });
    });

    it("should NOT throw if deadline is sent but unchanged, even if it's in the past", async () => {
      const pastDeadline = new Date(Date.now() - 100000).toISOString();
      TaskRepository.findById.mockResolvedValueOnce({
        id: taskId,
        deadline: new Date(pastDeadline).toISOString(),
      });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await expect(
        TaskService.updateTask(userId, taskId, { deadline: pastDeadline })
      ).resolves.toEqual({ id: taskId });

      expect(TaskRepository.update).toHaveBeenCalledWith(
        taskId,
        userId,
        expect.objectContaining({ deadline: pastDeadline })
      );
    });

    it("should throw if deadline IS changed to a new past date", async () => {
      const oldDeadline = new Date(Date.now() + 500000).toISOString();
      const newPastDeadline = new Date(Date.now() - 100000).toISOString();
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: oldDeadline });

      await expect(
        TaskService.updateTask(userId, taskId, { deadline: newPastDeadline })
      ).rejects.toThrow("Due date cannot be in the past");

      expect(TaskRepository.update).not.toHaveBeenCalled();
    });

    it("should allow changing deadline to a new future date", async () => {
      const oldDeadline = new Date(Date.now() + 100000).toISOString();
      const newFutureDeadline = new Date(Date.now() + 999999).toISOString();
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: oldDeadline });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await TaskService.updateTask(userId, taskId, { deadline: newFutureDeadline });

      expect(TaskRepository.update).toHaveBeenCalledWith(
        taskId,
        userId,
        expect.objectContaining({ deadline: newFutureDeadline })
      );
    });

    it("should validate as changed and reject past date when task previously had no deadline", async () => {
      const newPastDeadline = new Date(Date.now() - 100000).toISOString();
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: null });

      await expect(
        TaskService.updateTask(userId, taskId, { deadline: newPastDeadline })
      ).rejects.toThrow("Due date cannot be in the past");

      expect(TaskRepository.update).not.toHaveBeenCalled();
    });

    it("should accept a future deadline when task previously had no deadline", async () => {
      const newFutureDeadline = new Date(Date.now() + 100000).toISOString();
      TaskRepository.findById.mockResolvedValueOnce({ id: taskId, deadline: null });
      TaskRepository.update.mockResolvedValueOnce({ id: taskId });

      await TaskService.updateTask(userId, taskId, { deadline: newFutureDeadline });

      expect(TaskRepository.update).toHaveBeenCalledWith(
        taskId,
        userId,
        expect.objectContaining({ deadline: newFutureDeadline })
      );
    });
  });

  describe("deleteTask", () => {
    it("should delete successfully", async () => {
      TaskRepository.delete.mockResolvedValueOnce(true);

      const result = await TaskService.deleteTask(userId, taskId);

      expect(TaskRepository.delete).toHaveBeenCalledWith(taskId, userId);
      expect(result).toEqual({ message: "Task deleted successfully" });
    });

    it("should throw if task not found", async () => {
      TaskRepository.delete.mockResolvedValueOnce(false);

      await expect(TaskService.deleteTask(userId, taskId)).rejects.toThrow("Task not found");
    });
  });

  describe("getStats", () => {
    it("should return stats for user", async () => {
      TaskRepository.getStats.mockResolvedValueOnce({ total: 5 });

      const result = await TaskService.getStats(userId);

      expect(TaskRepository.getStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ total: 5 });
    });
  });
});
