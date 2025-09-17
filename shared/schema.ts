import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and user management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"), // user, admin
  banned: boolean("banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced events table
export const events = pgTable("events", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QR code settings per event
export const qrSettings = pgTable("qr_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  backgroundImage: text("background_image"),
  qrSize: integer("qr_size").default(200),
  qrPosition: jsonb("qr_position").default(sql`'{"x": 0, "y": 0}'`),
  textOverlays: jsonb("text_overlays").default(sql`'[]'`),
  customFields: jsonb("custom_fields").default(sql`'{}'`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form builder schemas for dynamic registration forms
export const formSchemas = pgTable("form_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  schema: jsonb("schema").notNull(), // Form field definitions
  layout: jsonb("layout").default(sql`'{}'`), // Layout configuration
  responsiveSettings: jsonb("responsive_settings").default(sql`'{"mobile": true, "tablet": true, "desktop": true}'`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced registrations with custom fields
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  position: text("position"),
  email: text("email"),
  customData: jsonb("custom_data").default(sql`'{}'`), // Additional form data
  registeredAt: timestamp("registered_at").defaultNow(),
});

// Schema definitions for forms and validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Safe registration schema that excludes role and banned fields for security
export const registrationSchema = createInsertSchema(users).omit({
  id: true,
  role: true,
  banned: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  qrCodeUrl: true,
  registrationUrl: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQrSettingsSchema = createInsertSchema(qrSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormSchemaSchema = createInsertSchema(formSchemas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  registeredAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegistrationData = z.infer<typeof registrationSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type QrSettings = typeof qrSettings.$inferSelect;
export type InsertQrSettings = z.infer<typeof insertQrSettingsSchema>;
export type FormSchema = typeof formSchemas.$inferSelect;
export type InsertFormSchema = z.infer<typeof insertFormSchemaSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Additional validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const qrConfigSchema = z.object({
  size: z.number().min(100).max(1000).default(200),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
  }).default({ x: 0, y: 0 }),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().default("#000000"),
});

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "radio", "file"]),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select, radio
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type QrConfig = z.infer<typeof qrConfigSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
