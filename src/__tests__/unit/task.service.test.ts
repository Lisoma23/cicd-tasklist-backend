import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Task } from "@prisma/client";

// Mock the prisma module before importing the service
vi.mock("../../lib/prisma.js", () => {
  return {
    default: {
      task: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

import prisma from "../../lib/prisma.js";
import * as taskService from "../../services/task.service.js";

const mockPrisma = vi.mocked(prisma);

const mockTask: Task = {
  id: 1,
  title: "Test Task",
  description: "A test task description",
  completed: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("TaskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all tasks ordered by createdAt desc", async () => {
      const tasks = [mockTask];
      (mockPrisma.task.findMany as any).mockResolvedValue(tasks);

      const result = await taskService.findAll();

      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("findById", () => {
    it("should return a task by ID", async () => {
      (mockPrisma.task.findUnique as any).mockResolvedValue(mockTask);
      const result = await taskService.findById(1);

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("create", () => {
    it("should create a new task", async () => {
      const input = { title: "New Task", description: "New task description" };
      (mockPrisma.task.create as any).mockResolvedValue(mockTask);

      const result = await taskService.create(input);

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: input.description,
        },
      });
    });
  });

  describe("update", () => {
    it("should update a task", async () => {
      const input = {
        title: "Task Update",
        description: "Task to update",
        completed: true,
      };
      (mockPrisma.task.update as any).mockResolvedValue(mockTask);

      const result = await taskService.update(2, input);

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: {
          title: "Task Update",
          description: "Task to update",
          completed: true,
        },
      });
    });

    it("should throw an error if task is not found", async () => {
      const input = {
        title: "Task Update",
        description: "Task to update",
        completed: true,
      };

      (mockPrisma.task.findUnique as any).mockResolvedValue(null);

      await expect(taskService.update(999, input)).rejects.toThrow(
        "Task not found",
      );

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe("remove", () => {
    it("should delete a task", async () => {
      (mockPrisma.task.delete as any).mockResolvedValue(mockTask);

      const existingTask = { ...mockTask, id: 1 };
      (mockPrisma.task.findUnique as any).mockResolvedValue(existingTask);

      const result = await taskService.remove(1);

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

	it("should throw an error if task is not found", async () => {

      (mockPrisma.task.findUnique as any).mockResolvedValue(null);

      await expect(taskService.remove(999)).rejects.toThrow(
        "Task not found",
      );

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
