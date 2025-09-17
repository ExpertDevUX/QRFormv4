import { 
  type Event, 
  type InsertEvent, 
  type Registration, 
  type InsertRegistration,
  type User,
  type InsertUser,
  type QrSettings,
  type InsertQrSettings,
  type FormSchema,
  type InsertFormSchema,
  users,
  events,
  registrations,
  qrSettings,
  formSchemas
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  banUser(id: string): Promise<boolean>;
  unbanUser(id: string): Promise<boolean>;
  
  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getEventsByUser(userId: string): Promise<Event[]>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // QR Settings
  createQrSettings(settings: InsertQrSettings): Promise<QrSettings>;
  getQrSettings(eventId: string): Promise<QrSettings | undefined>;
  updateQrSettings(id: string, settings: Partial<QrSettings>): Promise<QrSettings | undefined>;
  deleteQrSettings(id: string): Promise<boolean>;
  
  // Form Schemas
  createFormSchema(schema: InsertFormSchema): Promise<FormSchema>;
  getFormSchema(eventId: string): Promise<FormSchema | undefined>;
  updateFormSchema(id: string, schema: Partial<FormSchema>): Promise<FormSchema | undefined>;
  deleteFormSchema(id: string): Promise<boolean>;
  
  // Registrations
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistration(id: string): Promise<Registration | undefined>;
  getRegistrationsByEvent(eventId: string): Promise<Registration[]>;
  getAllRegistrations(): Promise<Registration[]>;
  updateRegistration(id: string, registration: Partial<Registration>): Promise<Registration | undefined>;
  deleteRegistration(id: string): Promise<boolean>;
  
  // Stats
  getStats(): Promise<{
    totalEvents: number;
    totalRegistrations: number;
    totalUsers: number;
    activeQRs: number;
    exports: number;
  }>;
}

const PgSession = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  private exportCount: number = 0;

  constructor() {
    // Use PostgreSQL for session storage
    this.sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userUpdate, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async banUser(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ banned: true, updatedAt: new Date() })
      .where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async unbanUser(id: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ banned: false, updatedAt: new Date() })
      .where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event methods
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const eventData = {
      ...insertEvent,
      registrationUrl: `/register/${insertEvent.userId}`,
      qrCodeUrl: null,
    };
    
    const [event] = await db
      .insert(events)
      .values(eventData)
      .returning();
    return event;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEventsByUser(userId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.userId, userId))
      .orderBy(desc(events.createdAt));
  }

  async updateEvent(id: string, eventUpdate: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({ ...eventUpdate, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // QR Settings methods
  async createQrSettings(insertSettings: InsertQrSettings): Promise<QrSettings> {
    const [settings] = await db
      .insert(qrSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async getQrSettings(eventId: string): Promise<QrSettings | undefined> {
    const [settings] = await db
      .select()
      .from(qrSettings)
      .where(eq(qrSettings.eventId, eventId));
    return settings || undefined;
  }

  async updateQrSettings(id: string, settingsUpdate: Partial<QrSettings>): Promise<QrSettings | undefined> {
    const [settings] = await db
      .update(qrSettings)
      .set({ ...settingsUpdate, updatedAt: new Date() })
      .where(eq(qrSettings.id, id))
      .returning();
    return settings || undefined;
  }

  async deleteQrSettings(id: string): Promise<boolean> {
    const result = await db.delete(qrSettings).where(eq(qrSettings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Form Schema methods
  async createFormSchema(insertSchema: InsertFormSchema): Promise<FormSchema> {
    const [schema] = await db
      .insert(formSchemas)
      .values(insertSchema)
      .returning();
    return schema;
  }

  async getFormSchema(eventId: string): Promise<FormSchema | undefined> {
    const [schema] = await db
      .select()
      .from(formSchemas)
      .where(eq(formSchemas.eventId, eventId));
    return schema || undefined;
  }

  async updateFormSchema(id: string, schemaUpdate: Partial<FormSchema>): Promise<FormSchema | undefined> {
    const [schema] = await db
      .update(formSchemas)
      .set({ ...schemaUpdate, updatedAt: new Date() })
      .where(eq(formSchemas.id, id))
      .returning();
    return schema || undefined;
  }

  async deleteFormSchema(id: string): Promise<boolean> {
    const result = await db.delete(formSchemas).where(eq(formSchemas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Registration methods
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db
      .insert(registrations)
      .values(insertRegistration)
      .returning();
    return registration;
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id));
    return registration || undefined;
  }

  async getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
    return await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId))
      .orderBy(desc(registrations.registeredAt));
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return await db
      .select()
      .from(registrations)
      .orderBy(desc(registrations.registeredAt));
  }

  async updateRegistration(id: string, registrationUpdate: Partial<Registration>): Promise<Registration | undefined> {
    const [registration] = await db
      .update(registrations)
      .set(registrationUpdate)
      .where(eq(registrations.id, id))
      .returning();
    return registration || undefined;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const result = await db.delete(registrations).where(eq(registrations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Stats
  async getStats(): Promise<{
    totalEvents: number;
    totalRegistrations: number;
    totalUsers: number;
    activeQRs: number;
    exports: number;
  }> {
    const [eventCount] = await db.select({ count: sql`count(*)` }).from(events);
    const [registrationCount] = await db.select({ count: sql`count(*)` }).from(registrations);
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [activeEvents] = await db.select({ count: sql`count(*)` }).from(events).where(eq(events.isActive, true));
    
    return {
      totalEvents: Number(eventCount?.count) || 0,
      totalRegistrations: Number(registrationCount?.count) || 0,
      totalUsers: Number(userCount?.count) || 0,
      activeQRs: Number(activeEvents?.count) || 0,
      exports: this.exportCount,
    };
  }

  incrementExportCount(): void {
    this.exportCount++;
  }
}

export const storage = new DatabaseStorage();