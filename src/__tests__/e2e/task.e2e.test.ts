import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
  default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
  beforeEach(async () => {
    // Clean up database between tests
    await testPrisma.task.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("POST /api/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "E2E Task", description: "E2E Description" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe("E2E Task");
      expect(res.body.description).toBe("E2E Description");
      expect(res.body.completed).toBe(false);
    });
  });

  describe("GET /api/tasks", () => {
    it("should retrieve all tasks", async () => {
      const res = await request(app).get("/api/tasks");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/tasks", () => {
    it("should retrieve one task", async () => {
      const resCreate = await request(app)
        .post("/api/tasks")
        .send({ title: "E2E Task", description: "E2E Description" });
      const res = await request(app).get(`/api/tasks/${resCreate.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe("E2E Task");
      expect(res.body.description).toBe("E2E Description");
      expect(res.body.completed).toBe(false);
    });
  });

  describe("PUT /api/tasks", () => {
    it("should update a task", async () => {
      const resCreate = await request(app)
        .post("/api/tasks")
        .send({ title: "E2E Task", description: "E2E Description" });

      const res = await request(app)
        .put(`/api/tasks/${resCreate.body.id}`)
        .send({
          title: "E2E Task Completed",
          description: "E2E Description Completed",
          completed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.id).toBe(resCreate.body.id);
      expect(res.body.title).toBe("E2E Task Completed");
      expect(res.body.description).toBe("E2E Description Completed");
      expect(res.body.completed).toBe(true);
    });

    it("should return an error if the task doesn't exist", async () => {
      const res = await request(app).put(`/api/tasks/${99}`).send({
        title: "E2E Task Completed",
        description: "E2E Description Completed",
        completed: true,
      });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/tasks", async () => {
    it("should delete a task", async () => {
      const resCreate = await request(app)
        .post("/api/tasks")
        .send({ title: "E2E Task", description: "E2E Description" });

      const res = await request(app).delete(`/api/tasks/${resCreate.body.id}`);

      expect(res.status).toBe(204);
    });

    it("should return an error if the task doesn't exist", async () => {
      const res = await request(app).delete(`/api/tasks/${99}`);

      expect(res.status).toBe(404);
    });
  });
});
