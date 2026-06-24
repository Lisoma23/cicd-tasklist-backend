import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type { Task } from "@prisma/client";

// Mock the service module
vi.mock("../../services/task.service.js", () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

import * as taskService from "../../services/task.service.js";
import * as taskController from "../../controllers/task.controller.js";

const mockService = vi.mocked(taskService);

const mockTask: Task = {
  id: 1,
  title: "Test Task",
  description: "Test description",
  completed: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

describe("TaskController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllTasks", () => {
    it("should return 200 with all tasks", async () => {
      const tasks = [mockTask];
      mockService.findAll.mockResolvedValue(tasks);
      const req = createMockRequest();
      const res = createMockResponse();

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(tasks);
    });

    it("should return 500 with error message when there is an error", async () => {
      mockService.findAll.mockRejectedValue(new Error("Database error"));

      const req = createMockRequest();
      const res = createMockResponse();

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch tasks" });
    });
  });

  describe("getTaskById", () => {
    it("should return 200 with the task when found", async () => {
      const task = mockTask;

      mockService.findById.mockResolvedValue(task);
      const req = createMockRequest(
        task.id ? { params: { id: task.id.toString() } } : {},
      );
      const res = createMockResponse();

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(task);
    });

    it("should return 400 with error message when the task ID is invalid", async () => {
      mockService.findById.mockResolvedValue(null);
      const req = createMockRequest({ params: { id: "s" } });
      const res = createMockResponse();

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid task ID" });
    });

    it("should return 404 with error message when the task is not found", async () => {
      mockService.findById.mockResolvedValue(null);
      const req = createMockRequest({ params: { id: "999" } });
      const res = createMockResponse();

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 500 with error message when there is an error", async () => {
      mockService.findById.mockRejectedValue(new Error("Database error"));
      const req = createMockRequest({ params: { id: "999" } });
      const res = createMockResponse();

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch task" });
    });
  });

  describe("createTask", () => {
    it("should return 201 when the task is created", async () => {
      const task = {
        title: "test",
        description: "test create Task",
      };

      const tasks = {
        ...mockTask,
        id: 2,
        title: "test",
        description: "test create Task",
      };

      mockService.create.mockResolvedValue(tasks);
      const req = createMockRequest({ body: task });
      const res = createMockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(tasks);
      expect(mockService.create).toHaveBeenCalledWith(task);
    });

	

    it("should return 201 when the description is not provided", async () => {
      const task = {
        title: "test",
      };

      const tasks = {
        ...mockTask,
        id: 2,
        title: "test",
      };

      mockService.create.mockResolvedValue(tasks);
      const req = createMockRequest({ body: task });
      const res = createMockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(tasks);
      expect(mockService.create).toHaveBeenCalledWith(task);
    });

	

    it("should return 400 with error message when the title is invalid", async () => {
      const task = {
        title: 0,
        description: "test create Task",
      };

      const tasks = {
        ...mockTask,
        id: 2,
        title: "test",
        description: "test create Task",
      };

      mockService.create.mockResolvedValue(tasks);
      const req = createMockRequest({ body: task });
      const res = createMockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Title is required and must be a non-empty string",
      });
    });

    it("should return 500 with error message when there is an error", async () => {
      const task = {
        title: "test",
        description: "test create Task",
      };

      mockService.create.mockRejectedValue(new Error("Database error"));
      const req = createMockRequest({ body: task });
      const res = createMockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to create task" });
    });
  });

  describe("updateTask", () => {
    it("should return 200 when the task is updated", async () => {
      const task = {
        title: "Updated Task",
        description: "Updated description",
        completed: true,
      };

      const updatedTask = {
        ...mockTask,
        title: "Updated Task",
        description: "Updated description",
        completed: true,
      };

      mockService.update.mockResolvedValue(updatedTask);

      const req = createMockRequest({
        params: { id: "3" },
        body: task,
      });
      const res = createMockResponse();

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedTask);
    });

    it("should return 400 with error message when the task ID is invalid", async () => {
      const task = {
        title: "Updated Task",
        description: "Updated description",
        completed: true,
      };

      const updatedTask = {
        ...mockTask,
        ...task,
      };

      mockService.update.mockResolvedValue(updatedTask);

      const req = createMockRequest({
        params: { id: "s" },
        body: task,
      });
      const res = createMockResponse();

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid task ID" });
    });

    it("should return 404 when task not found", async () => {
      mockService.update.mockRejectedValue(new Error("Task not found"));
      const req = createMockRequest({
        params: { id: "999" },
        body: { title: "Updated" },
      });
      const res = createMockResponse();

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 500 with error message when there is an error", async () => {
      const task = {
        title: "test",
        description: "test create Task",
      };

      mockService.update.mockRejectedValue(new Error("Database error"));
      const req = createMockRequest({ params: { id: "3" }, body: task });
      const res = createMockResponse();

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to update task" });
    });
  });

  describe("deleteTask", () => {
    it("should return 204 when the task is deleted", async () => {
      const newTask = {
        ...mockTask,
        title: "Task to be deleted",
        description: "This task will be deleted in the test",
      };

      mockService.remove.mockResolvedValue(newTask);
      const req = createMockRequest({ params: { id: "3" } });
      const res = createMockResponse();

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 400 with error message when the task ID is invalid", async () => {
      mockService.remove.mockResolvedValue(mockTask);
      const req = createMockRequest({ params: { id: "s" } });
      const res = createMockResponse();

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid task ID" });
    });

    it("should return 404 when task not found", async () => {
      mockService.remove.mockRejectedValue(new Error("Task not found"));
      const req = createMockRequest({ params: { id: "999" } });
      const res = createMockResponse();

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    it("should return 500 with error message when there is an error", async () => {
      mockService.remove.mockRejectedValue(new Error("Database error"));
      const req = createMockRequest({ params: { id: "3" } });
      const res = createMockResponse();

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to delete task" });
    });
  });
});
