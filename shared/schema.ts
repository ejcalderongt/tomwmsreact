import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'warehouse', 'zone', 'rack', 'shelf'
  parentId: integer("parent_id"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add self-reference after table definition
// Remove the broken relations for now

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  locationId: integer("location_id").references(() => locations.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const incomingOrders = pgTable("incoming_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: integer("supplier_id"),
  supplierName: text("supplier_name"),
  status: text("status").notNull().default("pending"), // 'pending', 'receiving', 'completed', 'cancelled'
  totalItems: integer("total_items").default(0),
  receivedItems: integer("received_items").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const incomingOrderItems = pgTable("incoming_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => incomingOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  expectedQuantity: integer("expected_quantity").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
  locationId: integer("location_id").references(() => locations.id),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  status: text("status").default("pending"), // 'pending', 'partial', 'completed'
});

export const outgoingOrders = pgTable("outgoing_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  status: text("status").notNull().default("pending"), // 'pending', 'picking', 'packed', 'shipped', 'cancelled'
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  totalItems: integer("total_items").default(0),
  pickedItems: integer("picked_items").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  shippedAt: timestamp("shipped_at"),
});

export const outgoingOrderItems = pgTable("outgoing_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => outgoingOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  requestedQuantity: integer("requested_quantity").notNull(),
  pickedQuantity: integer("picked_quantity").default(0),
  locationId: integer("location_id").references(() => locations.id),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  status: text("status").default("pending"), // 'pending', 'partial', 'completed'
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  locationId: integer("location_id").references(() => locations.id).notNull(),
  movementType: text("movement_type").notNull(), // 'in', 'out', 'transfer', 'adjustment'
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reference: text("reference"), // Order number or reference
  reason: text("reason"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertIncomingOrderSchema = createInsertSchema(incomingOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertIncomingOrderItemSchema = createInsertSchema(incomingOrderItems).omit({
  id: true,
});

export const insertOutgoingOrderSchema = createInsertSchema(outgoingOrders).omit({
  id: true,
  createdAt: true,
  shippedAt: true,
});

export const insertOutgoingOrderItemSchema = createInsertSchema(outgoingOrderItems).omit({
  id: true,
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type IncomingOrder = typeof incomingOrders.$inferSelect;
export type InsertIncomingOrder = z.infer<typeof insertIncomingOrderSchema>;
export type IncomingOrderItem = typeof incomingOrderItems.$inferSelect;
export type InsertIncomingOrderItem = z.infer<typeof insertIncomingOrderItemSchema>;
export type OutgoingOrder = typeof outgoingOrders.$inferSelect;
export type InsertOutgoingOrder = z.infer<typeof insertOutgoingOrderSchema>;
export type OutgoingOrderItem = typeof outgoingOrderItems.$inferSelect;
export type InsertOutgoingOrderItem = z.infer<typeof insertOutgoingOrderItemSchema>;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

// Auth schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
