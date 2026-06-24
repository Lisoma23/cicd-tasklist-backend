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

    it("should return 400 if title is missing", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ description: "No title" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 400 if title is empty string", async () => {
      const res = await request(app).post("/api/tasks").send({ title: "   " });
      expect(res.status).toBe(400);
    });

    it("should return 400 if title is not a string", async () => {
      const res = await request(app).post("/api/tasks").send({ title: 123 });
      expect(res.status).toBe(400);
    });

    it("should create a task without description", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "No description" });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("No description");
      expect(res.body.description).toBeNull(); // ou undefined selon ton schema Prisma
    });

    it("should trim the title", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "  Trimmed  " });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Trimmed");
    });
  });

  describe("GET /api/tasks", () => {
    it("should retrieve all tasks", async () => {
      const res = await request(app).get("/api/tasks");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/tasks/:id", () => {
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

    it("should return 400 for invalid id", async () => {
      const res = await request(app).get("/api/tasks/abc");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Invalid task ID");
    });

    it("should return 404 if task not found", async () => {
      const res = await request(app).get("/api/tasks/9999");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Task not found");
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

    it("should update only the completed field", async () => {
      const resCreate = await request(app)
        .post("/api/tasks")
        .send({ title: "Task", description: "Desc" });

      const res = await request(app)
        .put(`/api/tasks/${resCreate.body.id}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });
  });

  describe("DELETE /api/tasks", () => {
    it("should delete a task", async () => {
      const resCreate = await request(app)
        .post("/api/tasks")
        .send({ title: "E2E Task", description: "E2E Description" });

      const res = await request(app).delete(`/api/tasks/${resCreate.body.id}`);

      expect(res.status).toBe(204);

      // Verify deletion
      const getRes = await request(app).get(`/api/tasks/${resCreate.body.id}`);
      expect(getRes.status).toBe(404);
    });

    it("should return an error if the task doesn't exist", async () => {
      const res = await request(app).delete(`/api/tasks/${99}`);

      expect(res.status).toBe(404);
    });
  });
});
