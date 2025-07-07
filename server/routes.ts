import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertProductSchema, insertIncomingOrderSchema, insertOutgoingOrderSchema } from "@shared/schema";
import { z } from "zod";
import { apiClient } from "./api-client";
import { generateToken, verifyToken, encriptar } from "./encryption";

export async function registerRoutes(app: Express): Promise<Server> {
  // Token validation middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    req.user = decoded;
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Encrypt password before sending to external API
      const encryptedPassword = encriptar(password);
      
      // Try external API first
      const apiResponse = await apiClient.login(username, encryptedPassword);
      
      if (apiResponse.success && apiResponse.user) {
        // Check if user is active
        if (!apiResponse.user.isActive) {
          return res.status(401).json({ error: "Usuario inactivo" });
        }
        
        // Generate token for session
        const token = generateToken(
          apiResponse.user.id, 
          apiResponse.user.username, 
          apiResponse.user.idPropietario
        );
        
        res.json({ 
          user: {
            id: apiResponse.user.id,
            username: apiResponse.user.username,
            name: apiResponse.user.name,
            role: apiResponse.user.role || "user",
            idPropietario: apiResponse.user.idPropietario,
            nombrePropietario: apiResponse.user.nombrePropietario
          },
          token
        });
      } else {
        // Fallback to local storage for development
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return res.status(401).json({ error: "Credenciales inválidas" });
        }
        
        if (!user.isActive) {
          return res.status(401).json({ error: "Usuario inactivo" });
        }
        
        const token = generateToken(user.id, user.username);
        
        res.json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            name: user.name, 
            role: user.role 
          },
          token
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Error de autenticación" });
    }
  });

  // Validate token endpoint
  app.get("/api/auth/validate", authenticateToken, async (req, res) => {
    res.json({ valid: true, user: req.user });
  });
  
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Sesión cerrada exitosamente" });
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
  app.get("/api/incoming-orders", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Try external API first
      const apiResponse = await apiClient.getIncomingOrders(
        startDate as string,
        endDate as string
      );
      
      if (apiResponse.success && apiResponse.data) {
        res.json(apiResponse.data);
      } else {
        // Fallback to local storage
        let orders = await storage.getIncomingOrders();
        
        // Apply date filtering if provided
        if (startDate || endDate) {
          orders = orders.filter(order => {
            const orderDate = new Date(order.createdAt || 0);
            const start = startDate ? new Date(startDate as string) : null;
            const end = endDate ? new Date(endDate as string) : null;
            
            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;
            return true;
          });
        }
        
        res.json(orders);
      }
    } catch (error) {
      console.error("Error fetching incoming orders:", error);
      res.status(500).json({ message: "Error al obtener órdenes de ingreso" });
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
  app.get("/api/outgoing-orders", authenticateToken, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Try external API first
      const apiResponse = await apiClient.getOutgoingOrders(
        startDate as string,
        endDate as string
      );
      
      if (apiResponse.success && apiResponse.data) {
        res.json(apiResponse.data);
      } else {
        // Fallback to local storage
        let orders = await storage.getOutgoingOrders();
        
        // Apply date filtering if provided
        if (startDate || endDate) {
          orders = orders.filter(order => {
            const orderDate = new Date(order.createdAt || 0);
            const start = startDate ? new Date(startDate as string) : null;
            const end = endDate ? new Date(endDate as string) : null;
            
            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;
            return true;
          });
        }
        
        res.json(orders);
      }
    } catch (error) {
      console.error("Error fetching outgoing orders:", error);
      res.status(500).json({ message: "Error al obtener órdenes de salida" });
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
