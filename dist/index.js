var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  events: () => events,
  formFieldSchema: () => formFieldSchema,
  formSchemas: () => formSchemas,
  insertEventSchema: () => insertEventSchema,
  insertFormSchemaSchema: () => insertFormSchemaSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertQrSettingsSchema: () => insertQrSettingsSchema,
  insertRegistrationSchema: () => insertRegistrationSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  passwordResetTokens: () => passwordResetTokens,
  qrConfigSchema: () => qrConfigSchema,
  qrSettings: () => qrSettings,
  registrationSchema: () => registrationSchema,
  registrations: () => registrations,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  // user, admin
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  eventDate: text("event_date"),
  eventTime: text("event_time"),
  qrCodeUrl: text("qr_code_url"),
  registrationUrl: text("registration_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var qrSettings = pgTable("qr_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  backgroundImage: text("background_image"),
  qrSize: integer("qr_size").default(200),
  qrPosition: jsonb("qr_position").default(sql`'{"x": 0, "y": 0}'`),
  textOverlays: jsonb("text_overlays").default(sql`'[]'`),
  customFields: jsonb("custom_fields").default(sql`'{}'`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var formSchemas = pgTable("form_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  schema: jsonb("schema").notNull(),
  // Form field definitions
  layout: jsonb("layout").default(sql`'{}'`),
  // Layout configuration
  responsiveSettings: jsonb("responsive_settings").default(sql`'{"mobile": true, "tablet": true, "desktop": true}'`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  position: text("position"),
  email: text("email"),
  customData: jsonb("custom_data").default(sql`'{}'`),
  // Additional form data
  registeredAt: timestamp("registered_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var registrationSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  banned: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters")
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  qrCodeUrl: true,
  registrationUrl: true,
  createdAt: true,
  updatedAt: true
});
var insertQrSettingsSchema = createInsertSchema(qrSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertFormSchemaSchema = createInsertSchema(formSchemas).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  registeredAt: true
});
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var qrConfigSchema = z.object({
  size: z.number().min(100).max(1e3).default(200),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0)
  }).default({ x: 0, y: 0 }),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().default("#000000")
});
var formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "radio", "file"]),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  // for select, radio
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, sql as sql2 } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
var PgSession = connectPgSimple(session);
var DatabaseStorage = class {
  sessionStore;
  exportCount = 0;
  constructor() {
    this.sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true
    });
  }
  // User methods
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUser(id, userUpdate) {
    const [user] = await db.update(users).set({ ...userUpdate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
  async banUser(id) {
    const result = await db.update(users).set({ banned: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
    return result.rowCount > 0;
  }
  async unbanUser(id) {
    const result = await db.update(users).set({ banned: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
    return result.rowCount > 0;
  }
  // Event methods
  async createEvent(insertEvent) {
    const eventData = {
      ...insertEvent,
      registrationUrl: `/register/${insertEvent.userId}`,
      qrCodeUrl: null
    };
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }
  async getEvent(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || void 0;
  }
  async getAllEvents() {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }
  async getEventsByUser(userId) {
    return await db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt));
  }
  async updateEvent(id, eventUpdate) {
    const [event] = await db.update(events).set({ ...eventUpdate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(events.id, id)).returning();
    return event || void 0;
  }
  async deleteEvent(id) {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount > 0;
  }
  // QR Settings methods
  async createQrSettings(insertSettings) {
    const [settings] = await db.insert(qrSettings).values(insertSettings).returning();
    return settings;
  }
  async getQrSettings(eventId) {
    const [settings] = await db.select().from(qrSettings).where(eq(qrSettings.eventId, eventId));
    return settings || void 0;
  }
  async updateQrSettings(id, settingsUpdate) {
    const [settings] = await db.update(qrSettings).set({ ...settingsUpdate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(qrSettings.id, id)).returning();
    return settings || void 0;
  }
  async deleteQrSettings(id) {
    const result = await db.delete(qrSettings).where(eq(qrSettings.id, id));
    return result.rowCount > 0;
  }
  // Form Schema methods
  async createFormSchema(insertSchema) {
    const [schema] = await db.insert(formSchemas).values(insertSchema).returning();
    return schema;
  }
  async getFormSchema(eventId) {
    const [schema] = await db.select().from(formSchemas).where(eq(formSchemas.eventId, eventId));
    return schema || void 0;
  }
  async updateFormSchema(id, schemaUpdate) {
    const [schema] = await db.update(formSchemas).set({ ...schemaUpdate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(formSchemas.id, id)).returning();
    return schema || void 0;
  }
  async deleteFormSchema(id) {
    const result = await db.delete(formSchemas).where(eq(formSchemas.id, id));
    return result.rowCount > 0;
  }
  // Registration methods
  async createRegistration(insertRegistration) {
    const [registration] = await db.insert(registrations).values(insertRegistration).returning();
    return registration;
  }
  async getRegistration(id) {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration || void 0;
  }
  async getRegistrationsByEvent(eventId) {
    return await db.select().from(registrations).where(eq(registrations.eventId, eventId)).orderBy(desc(registrations.registeredAt));
  }
  async getAllRegistrations() {
    return await db.select().from(registrations).orderBy(desc(registrations.registeredAt));
  }
  async updateRegistration(id, registrationUpdate) {
    const [registration] = await db.update(registrations).set(registrationUpdate).where(eq(registrations.id, id)).returning();
    return registration || void 0;
  }
  async deleteRegistration(id) {
    const result = await db.delete(registrations).where(eq(registrations.id, id));
    return result.rowCount > 0;
  }
  // Stats
  async getStats() {
    const [eventCount] = await db.select({ count: sql2`count(*)` }).from(events);
    const [registrationCount] = await db.select({ count: sql2`count(*)` }).from(registrations);
    const [userCount] = await db.select({ count: sql2`count(*)` }).from(users);
    const [activeEvents] = await db.select({ count: sql2`count(*)` }).from(events).where(eq(events.isActive, true));
    return {
      totalEvents: Number(eventCount?.count) || 0,
      totalRegistrations: Number(registrationCount?.count) || 0,
      totalUsers: Number(userCount?.count) || 0,
      activeQRs: Number(activeEvents?.count) || 0,
      exports: this.exportCount
    };
  }
  incrementExportCount() {
    this.exportCount++;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z3 } from "zod";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z as z2 } from "zod";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  if (process.env.NODE_ENV === "production" && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "dev-secret-key-change-in-production")) {
    throw new Error("SESSION_SECRET environment variable must be set with a strong secret in production");
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      // CSRF protection
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Invalid credentials" });
          }
          if (user.banned) {
            return done(null, false, { message: "Invalid credentials" });
          }
          if (!await comparePasswords(password, user.password)) {
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const userData = registrationSchema.parse(req.body);
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      let user;
      try {
        user = await storage.createUser({
          ...userData,
          password: await hashPassword(userData.password),
          role: "user",
          // Force role to user for security
          banned: false
          // Force banned to false for security
        });
        console.log("User created successfully:", user.id, user.username);
      } catch (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.login(user, (err2) => {
          if (err2) return next(err2);
          res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            banned: user.banned,
            createdAt: user.createdAt
          });
        });
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.regenerate((err2) => {
        if (err2) return next(err2);
        req.login(user, (err3) => {
          if (err3) return next(err3);
          res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            banned: user.banned,
            createdAt: user.createdAt
          });
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err2) => {
        if (err2) return next(err2);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt
    });
  });
}
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = req.user;
  if (user.banned) {
    req.logout((err) => {
      if (err) console.error("Error logging out banned user:", err);
    });
    return res.status(403).json({ message: "Access denied" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = req.user;
  if (user.banned) {
    req.logout((err) => {
      if (err) console.error("Error logging out banned user:", err);
    });
    return res.status(403).json({ message: "Access denied" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/users/:id/ban", requireAdmin, async (req, res) => {
    try {
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
  app2.patch("/api/users/:id/unban", requireAdmin, async (req, res) => {
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
  app2.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
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
  app2.get("/api/events", async (req, res) => {
    try {
      const events2 = await storage.getAllEvents();
      res.json(events2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  app2.get("/api/events/:id", async (req, res) => {
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
  app2.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  app2.patch("/api/events/:id", async (req, res) => {
    try {
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });
  app2.delete("/api/events/:id", async (req, res) => {
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
  app2.get("/api/registrations", async (req, res) => {
    try {
      const { eventId } = req.query;
      let registrations2;
      if (eventId) {
        registrations2 = await storage.getRegistrationsByEvent(eventId);
      } else {
        registrations2 = await storage.getAllRegistrations();
      }
      res.json(registrations2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });
  app2.post("/api/registrations", async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.parse(req.body);
      const registration = await storage.createRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  });
  app2.patch("/api/registrations/:id", async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.partial().parse(req.body);
      const registration = await storage.updateRegistration(req.params.id, registrationData);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.json(registration);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update registration" });
    }
  });
  app2.delete("/api/registrations/:id", async (req, res) => {
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
  app2.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app2.post("/api/qr-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.createQrSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create QR settings" });
    }
  });
  app2.get("/api/qr-settings/:eventId", requireAuth, async (req, res) => {
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
  app2.patch("/api/qr-settings/:id", requireAuth, async (req, res) => {
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
  app2.delete("/api/qr-settings/:id", requireAuth, async (req, res) => {
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
  app2.post("/api/export", async (req, res) => {
    try {
      storage.incrementExportCount();
      res.json({ message: "Export count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment export count" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets")
    }
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        process.cwd(),
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Server error:", err);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
