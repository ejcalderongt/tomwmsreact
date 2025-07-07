import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertProductSchema, insertIncomingOrderSchema, insertOutgoingOrderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });
  
  // Dashboard routes
  app.get("/api/dashboard", async (req, res) => {
    try {
      const data = await storage.getDashboardData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });
  
  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });
  
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  
  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  
  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      const products = await storage.getProducts();
      const locations = await storage.getLocations();
      
      const enrichedInventory = inventory.map(inv => ({
        ...inv,
        product: products.find(p => p.id === inv.productId),
        location: locations.find(l => l.id === inv.locationId)
      }));
      
      res.json(enrichedInventory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching inventory" });
    }
  });
  
  app.put("/api/inventory/:productId/:locationId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const locationId = parseInt(req.params.locationId);
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const inventory = await storage.updateInventory(productId, locationId, quantity);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Error updating inventory" });
    }
  });
  
  // Incoming orders routes
  app.get("/api/incoming-orders", async (req, res) => {
    try {
      const orders = await storage.getIncomingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching incoming orders" });
    }
  });
  
  app.get("/api/incoming-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getIncomingOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Incoming order not found" });
      }
      
      const items = await storage.getIncomingOrderItems(id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ message: "Error fetching incoming order" });
    }
  });
  
  app.post("/api/incoming-orders", async (req, res) => {
    try {
      const orderData = insertIncomingOrderSchema.parse(req.body);
      const order = await storage.createIncomingOrder(orderData);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid incoming order data" });
    }
  });
  
  // Outgoing orders routes
  app.get("/api/outgoing-orders", async (req, res) => {
    try {
      const orders = await storage.getOutgoingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching outgoing orders" });
    }
  });
  
  app.get("/api/outgoing-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOutgoingOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Outgoing order not found" });
      }
      
      const items = await storage.getOutgoingOrderItems(id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ message: "Error fetching outgoing order" });
    }
  });
  
  app.post("/api/outgoing-orders", async (req, res) => {
    try {
      const orderData = insertOutgoingOrderSchema.parse(req.body);
      const order = await storage.createOutgoingOrder(orderData);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid outgoing order data" });
    }
  });
  
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  // Locations routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching locations" });
    }
  });
  
  // Inventory movements routes
  app.get("/api/inventory-movements", async (req, res) => {
    try {
      const movements = await storage.getInventoryMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching inventory movements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
