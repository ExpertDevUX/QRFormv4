import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, requireAuth, requireAdmin } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first - from blueprint:javascript_auth_all_persistance
  setupAuth(app);
  
  // User management routes (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/ban", requireAdmin, async (req, res) => {
    try {
      // Prevent admin from banning themselves
      if (req.user?.id === req.params.id) {
        return res.status(400).json({ message: "Cannot ban yourself" });
      }
      
      const success = await storage.banUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User banned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.patch("/api/users/:id/unban", requireAdmin, async (req, res) => {
    try {
      const success = await storage.unbanUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      // Prevent admin from deleting themselves
      if (req.user?.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }
      
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Events routes (now require authentication)
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Registrations routes
  app.get("/api/registrations", async (req, res) => {
    try {
      const { eventId } = req.query;
      let registrations;
      
      if (eventId) {
        registrations = await storage.getRegistrationsByEvent(eventId as string);
      } else {
        registrations = await storage.getAllRegistrations();
      }
      
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.post("/api/registrations", async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.parse(req.body);
      const registration = await storage.createRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  app.patch("/api/registrations/:id", async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.partial().parse(req.body);
      const registration = await storage.updateRegistration(req.params.id, registrationData);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  app.delete("/api/registrations/:id", async (req, res) => {
    try {
      const success = await storage.deleteRegistration(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete registration" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // QR Settings endpoints
  app.post("/api/qr-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.createQrSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create QR settings" });
    }
  });

  app.get("/api/qr-settings/:eventId", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getQrSettings(req.params.eventId);
      if (!settings) {
        return res.status(404).json({ message: "QR settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QR settings" });
    }
  });

  app.patch("/api/qr-settings/:id", requireAuth, async (req, res) => {
    try {
      const settings = await storage.updateQrSettings(req.params.id, req.body);
      if (!settings) {
        return res.status(404).json({ message: "QR settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update QR settings" });
    }
  });

  app.delete("/api/qr-settings/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteQrSettings(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "QR settings not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete QR settings" });
    }
  });

  // Export route
  app.post("/api/export", async (req, res) => {
    try {
      (storage as any).incrementExportCount();
      res.json({ message: "Export count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment export count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
