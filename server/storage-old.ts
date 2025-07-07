import { 
  users, products, categories, locations, inventory, 
  incomingOrders, incomingOrderItems, outgoingOrders, outgoingOrderItems,
  inventoryMovements,
  type User, type InsertUser, type Product, type InsertProduct,
  type Category, type InsertCategory, type Location, type InsertLocation,
  type Inventory, type InsertInventory, type IncomingOrder, type InsertIncomingOrder,
  type IncomingOrderItem, type InsertIncomingOrderItem,
  type OutgoingOrder, type InsertOutgoingOrder, type OutgoingOrderItem, type InsertOutgoingOrderItem,
  type InventoryMovement, type InsertInventoryMovement
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Locations
  getLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  
  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryByProduct(productId: number): Promise<Inventory[]>;
  getInventoryByLocation(locationId: number): Promise<Inventory[]>;
  updateInventory(productId: number, locationId: number, quantity: number): Promise<Inventory>;
  
  // Incoming Orders
  getIncomingOrders(): Promise<IncomingOrder[]>;
  getIncomingOrder(id: number): Promise<IncomingOrder | undefined>;
  createIncomingOrder(order: InsertIncomingOrder): Promise<IncomingOrder>;
  updateIncomingOrder(id: number, order: Partial<InsertIncomingOrder>): Promise<IncomingOrder>;
  
  // Incoming Order Items
  getIncomingOrderItems(orderId: number): Promise<IncomingOrderItem[]>;
  createIncomingOrderItem(item: InsertIncomingOrderItem): Promise<IncomingOrderItem>;
  updateIncomingOrderItem(id: number, item: Partial<InsertIncomingOrderItem>): Promise<IncomingOrderItem>;
  
  // Outgoing Orders
  getOutgoingOrders(): Promise<OutgoingOrder[]>;
  getOutgoingOrder(id: number): Promise<OutgoingOrder | undefined>;
  createOutgoingOrder(order: InsertOutgoingOrder): Promise<OutgoingOrder>;
  updateOutgoingOrder(id: number, order: Partial<InsertOutgoingOrder>): Promise<OutgoingOrder>;
  
  // Outgoing Order Items
  getOutgoingOrderItems(orderId: number): Promise<OutgoingOrderItem[]>;
  createOutgoingOrderItem(item: InsertOutgoingOrderItem): Promise<OutgoingOrderItem>;
  updateOutgoingOrderItem(id: number, item: Partial<InsertOutgoingOrderItem>): Promise<OutgoingOrderItem>;
  
  // Inventory Movements
  getInventoryMovements(): Promise<InventoryMovement[]>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  
  // Dashboard Data
  getDashboardData(): Promise<{
    totalProducts: number;
    lowStock: number;
    todayIncoming: number;
    pendingOutgoing: number;
    recentActivities: any[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private categories: Map<number, Category> = new Map();
  private locations: Map<number, Location> = new Map();
  private products: Map<number, Product> = new Map();
  private inventory: Map<string, Inventory> = new Map(); // key: "productId-locationId"
  private incomingOrders: Map<number, IncomingOrder> = new Map();
  private incomingOrderItems: Map<number, IncomingOrderItem> = new Map();
  private outgoingOrders: Map<number, OutgoingOrder> = new Map();
  private outgoingOrderItems: Map<number, OutgoingOrderItem> = new Map();
  private inventoryMovements: Map<number, InventoryMovement> = new Map();
  
  private currentId = 1;
  
  constructor() {
    this.initializeData();
  }
  
  private initializeData() {
    // Create default admin user
    const adminUser: User = {
      id: 1,
      username: "admin",
      password: "admin123", // In production, this should be hashed
      name: "Erik Calderón",
      role: "admin",
      createdAt: new Date(),
      isActive: true,
    };
    this.users.set(1, adminUser);
    
    // Create default categories
    const categories = [
      { id: 1, name: "Electrónicos", description: "Productos electrónicos", createdAt: new Date() },
      { id: 2, name: "Hogar", description: "Productos para el hogar", createdAt: new Date() },
      { id: 3, name: "Oficina", description: "Productos de oficina", createdAt: new Date() },
    ];
    categories.forEach(cat => this.categories.set(cat.id, cat));
    
    // Create default locations
    const locations = [
      { id: 1, code: "WH-001", name: "Almacén Principal", type: "warehouse", parentId: null, capacity: 1000, isActive: true, createdAt: new Date() },
      { id: 2, code: "ZN-A01", name: "Zona A", type: "zone", parentId: 1, capacity: 500, isActive: true, createdAt: new Date() },
      { id: 3, code: "RK-A01", name: "Rack A1", type: "rack", parentId: 2, capacity: 100, isActive: true, createdAt: new Date() },
    ];
    locations.forEach(loc => this.locations.set(loc.id, loc));
    
    // Create default products
    const products = [
      { id: 1, sku: "ABC-123", name: "Laptop HP", description: "Laptop HP Pavilion", categoryId: 1, unitPrice: "899.99", minStock: 10, maxStock: 100, isActive: true, createdAt: new Date() },
      { id: 2, sku: "XYZ-456", name: "Silla Oficina", description: "Silla ergonómica de oficina", categoryId: 3, unitPrice: "199.99", minStock: 5, maxStock: 50, isActive: true, createdAt: new Date() },
      { id: 3, sku: "DEF-789", name: "Aspiradora", description: "Aspiradora para hogar", categoryId: 2, unitPrice: "149.99", minStock: 3, maxStock: 30, isActive: true, createdAt: new Date() },
    ];
    products.forEach(prod => this.products.set(prod.id, prod));
    
    // Create default inventory
    const inventoryItems = [
      { id: 1, productId: 1, locationId: 1, quantity: 50, reservedQuantity: 5, lastUpdated: new Date() },
      { id: 2, productId: 2, locationId: 1, quantity: 25, reservedQuantity: 2, lastUpdated: new Date() },
      { id: 3, productId: 3, locationId: 1, quantity: 5, reservedQuantity: 0, lastUpdated: new Date() },
    ];
    inventoryItems.forEach(inv => this.inventory.set(`${inv.productId}-${inv.locationId}`, inv));
    
    this.currentId = 4;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      createdAt: new Date(),
      isActive: true,
    };
    this.users.set(id, user);
    return user;
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentId++;
    const category: Category = {
      id,
      name: insertCategory.name,
      description: insertCategory.description || null,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }
  
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
  
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.currentId++;
    const location: Location = {
      id,
      code: insertLocation.code,
      name: insertLocation.name,
      type: insertLocation.type,
      parentId: insertLocation.parentId || null,
      capacity: insertLocation.capacity || null,
      isActive: insertLocation.isActive !== undefined ? insertLocation.isActive : true,
      createdAt: new Date(),
    };
    this.locations.set(id, location);
    return location;
  }
  
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId++;
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    const updated: Product = {
      ...existing,
      ...updateProduct,
    };
    this.products.set(id, updated);
    return updated;
  }
  
  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }
  
  async getInventoryByProduct(productId: number): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.productId === productId);
  }
  
  async getInventoryByLocation(locationId: number): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.locationId === locationId);
  }
  
  async updateInventory(productId: number, locationId: number, quantity: number): Promise<Inventory> {
    const key = `${productId}-${locationId}`;
    const existing = this.inventory.get(key);
    
    if (existing) {
      const updated: Inventory = {
        ...existing,
        quantity,
        lastUpdated: new Date(),
      };
      this.inventory.set(key, updated);
      return updated;
    } else {
      const id = this.currentId++;
      const newInventory: Inventory = {
        id,
        productId,
        locationId,
        quantity,
        reservedQuantity: 0,
        lastUpdated: new Date(),
      };
      this.inventory.set(key, newInventory);
      return newInventory;
    }
  }
  
  async getIncomingOrders(): Promise<IncomingOrder[]> {
    return Array.from(this.incomingOrders.values());
  }
  
  async getIncomingOrder(id: number): Promise<IncomingOrder | undefined> {
    return this.incomingOrders.get(id);
  }
  
  async createIncomingOrder(insertOrder: InsertIncomingOrder): Promise<IncomingOrder> {
    const id = this.currentId++;
    const order: IncomingOrder = {
      ...insertOrder,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.incomingOrders.set(id, order);
    return order;
  }
  
  async updateIncomingOrder(id: number, updateOrder: Partial<InsertIncomingOrder>): Promise<IncomingOrder> {
    const existing = this.incomingOrders.get(id);
    if (!existing) {
      throw new Error(`Incoming order with id ${id} not found`);
    }
    
    const updated: IncomingOrder = {
      ...existing,
      ...updateOrder,
    };
    this.incomingOrders.set(id, updated);
    return updated;
  }
  
  async getIncomingOrderItems(orderId: number): Promise<IncomingOrderItem[]> {
    return Array.from(this.incomingOrderItems.values()).filter(item => item.orderId === orderId);
  }
  
  async createIncomingOrderItem(insertItem: InsertIncomingOrderItem): Promise<IncomingOrderItem> {
    const id = this.currentId++;
    const item: IncomingOrderItem = {
      ...insertItem,
      id,
    };
    this.incomingOrderItems.set(id, item);
    return item;
  }
  
  async updateIncomingOrderItem(id: number, updateItem: Partial<InsertIncomingOrderItem>): Promise<IncomingOrderItem> {
    const existing = this.incomingOrderItems.get(id);
    if (!existing) {
      throw new Error(`Incoming order item with id ${id} not found`);
    }
    
    const updated: IncomingOrderItem = {
      ...existing,
      ...updateItem,
    };
    this.incomingOrderItems.set(id, updated);
    return updated;
  }
  
  async getOutgoingOrders(): Promise<OutgoingOrder[]> {
    return Array.from(this.outgoingOrders.values());
  }
  
  async getOutgoingOrder(id: number): Promise<OutgoingOrder | undefined> {
    return this.outgoingOrders.get(id);
  }
  
  async createOutgoingOrder(insertOrder: InsertOutgoingOrder): Promise<OutgoingOrder> {
    const id = this.currentId++;
    const order: OutgoingOrder = {
      ...insertOrder,
      id,
      createdAt: new Date(),
      shippedAt: null,
    };
    this.outgoingOrders.set(id, order);
    return order;
  }
  
  async updateOutgoingOrder(id: number, updateOrder: Partial<InsertOutgoingOrder>): Promise<OutgoingOrder> {
    const existing = this.outgoingOrders.get(id);
    if (!existing) {
      throw new Error(`Outgoing order with id ${id} not found`);
    }
    
    const updated: OutgoingOrder = {
      ...existing,
      ...updateOrder,
    };
    this.outgoingOrders.set(id, updated);
    return updated;
  }
  
  async getOutgoingOrderItems(orderId: number): Promise<OutgoingOrderItem[]> {
    return Array.from(this.outgoingOrderItems.values()).filter(item => item.orderId === orderId);
  }
  
  async createOutgoingOrderItem(insertItem: InsertOutgoingOrderItem): Promise<OutgoingOrderItem> {
    const id = this.currentId++;
    const item: OutgoingOrderItem = {
      ...insertItem,
      id,
    };
    this.outgoingOrderItems.set(id, item);
    return item;
  }
  
  async updateOutgoingOrderItem(id: number, updateItem: Partial<InsertOutgoingOrderItem>): Promise<OutgoingOrderItem> {
    const existing = this.outgoingOrderItems.get(id);
    if (!existing) {
      throw new Error(`Outgoing order item with id ${id} not found`);
    }
    
    const updated: OutgoingOrderItem = {
      ...existing,
      ...updateItem,
    };
    this.outgoingOrderItems.set(id, updated);
    return updated;
  }
  
  async getInventoryMovements(): Promise<InventoryMovement[]> {
    return Array.from(this.inventoryMovements.values());
  }
  
  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    const id = this.currentId++;
    const movement: InventoryMovement = {
      ...insertMovement,
      id,
      createdAt: new Date(),
    };
    this.inventoryMovements.set(id, movement);
    return movement;
  }
  
  async getDashboardData(): Promise<{
    totalProducts: number;
    lowStock: number;
    todayIncoming: number;
    pendingOutgoing: number;
    recentActivities: any[];
  }> {
    const totalProducts = this.products.size;
    const lowStock = Array.from(this.inventory.values()).filter(inv => {
      const product = this.products.get(inv.productId);
      return product && inv.quantity <= (product.minStock || 0);
    }).length;
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayIncoming = Array.from(this.incomingOrders.values()).filter(order => 
      order.createdAt && order.createdAt >= startOfDay
    ).length;
    
    const pendingOutgoing = Array.from(this.outgoingOrders.values()).filter(order => 
      order.status === 'pending' || order.status === 'picking'
    ).length;
    
    const recentActivities = Array.from(this.inventoryMovements.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 10)
      .map(movement => {
        const product = this.products.get(movement.productId);
        const user = this.users.get(movement.createdBy || 1);
        return {
          type: movement.movementType,
          description: `${movement.movementType === 'in' ? 'Ingreso' : 'Salida'} de ${movement.quantity} unidades - ${product?.name || 'Producto'}`,
          reference: movement.reference,
          user: user?.name || 'Sistema',
          timestamp: movement.createdAt,
          status: 'completado'
        };
      });
    
    return {
      totalProducts,
      lowStock,
      todayIncoming,
      pendingOutgoing,
      recentActivities
    };
  }
}

export const storage = new MemStorage();
