# TOM WMS - Sistema de Gestión de Almacén

## Overview
TOM WMS (Warehouse Management System) is a web application built with React, TypeScript, and Vite. Its primary purpose is to provide real-time inventory management, detailed stock analysis, and advanced reporting capabilities for warehouse operations. The system integrates with an external HTTP API and features an AI-powered inventory assistant.

Key Capabilities:
- Real-time inventory tracking and movement history.
- Advanced analytics for stock aging, expiry, warehouse distribution, and product composition.
- Executive dashboards and operational KPIs for comprehensive oversight.
- Operator productivity tracking and ABC analysis for product classification.
- AI Assistant for conversational queries about inventory data.
- Professional Excel export functionality for inventory data.

The project aims to streamline warehouse operations, improve inventory accuracy, reduce waste from expired or slow-moving goods, and enhance decision-making through data-driven insights.

## User Preferences
- **Language:** The user speaks Spanish, and the UI should be in Spanish.
- **Coding Style:** Strict TypeScript, functional components with hooks, Tailwind CSS for styling, and toast notifications for error handling.
- **Workflow:** Iterative development, focusing on clear communication and avoiding breaking changes without prior consultation.
- **Interaction:** Prefer detailed explanations for complex features and architectural decisions.

## System Architecture

The application follows a client-server architecture. The frontend is a React 18 application with TypeScript and Vite, using React Router DOM for navigation and Tailwind CSS for styling. It connects to an external HTTP API via an Express.js proxy server.

**UI/UX Decisions:**
- **Layout:** A main layout component (`Layout.tsx`) manages the sidebar and primary navigation, ensuring a consistent user experience.
- **Navigation:** Simplified sidebar navigation focusing on key modules.
- **Theming:** Semantic colors are used for inventory statuses (e.g., RECEPCIÓN=blue, PICKING=green, MERMA=red).
- **Reporting:** All reports include a `ReportDescription` component for consistent titling, descriptions, key metrics, and interpretation. Color codes differentiate analytical modules.
- **Data Visualization:** Utilizes various charts (bar charts, treemaps) and visual indicators (traffic lights) for intuitive data representation in analysis modules.
- **Excel Export:** Uses ExcelJS for professional-grade Excel exports with custom headers, corporate logos, and extensive styling.

**Technical Implementations:**
- **Frontend Framework:** React 18 + TypeScript + Vite.
- **Routing:** React Router DOM.
- **Styling:** Tailwind CSS.
- **Iconography:** Heroicons.
- **Notifications:** React Hot Toast.
- **API Client:** Configured to interact with the backend via a proxy (`api.ts`, `auth.ts`).
- **Proxy Server:** An Express.js server (`server.js`) acts as a crucial intermediary:
    - Proxies HTTP requests from the HTTPS frontend to the HTTP backend API, resolving mixed content issues.
    - Hosts an AI chat endpoint (`/ai/chat`) for the inventory assistant.
    - Serves static build files of the frontend.
    - CORS is enabled on the proxy.
- **AI Integration:** Uses OpenAI (gpt-4o) via Replit AI Integrations for the `AsistenteInventario.tsx` module, providing conversational inventory queries with real-time streaming responses and automatic context from inventory data.
- **Excel Export:** Migrated from `xlsx` to `exceljs` to support advanced styling, including corporate logo insertion, merged cells, professional headers, and dynamic data formatting.
- **Data Handling:** Client-side processing for `ResumenExistencias` by grouping data from `existenciasAPI.listar()` when a direct backend endpoint is unavailable.

**Feature Specifications:**
- **Inventory Modules:** `InventarioEnLinea`, `Existencias`, `ResumenExistencias`, `Movimientos`.
- **Analysis Modules:** `AnalisisInventario` (Vencimientos, Antigüedad, Por Bodega, Composición), `DashboardEjecutivo`, `AnalisisCiclo`, `ProductividadOperadores`, `ABCProductos`, `AnalisisMerma`.
- **Login Module:** `Login.tsx`.

## External Dependencies
- **Backend API:** `http://52.41.114.122:8097` (external HTTP API).
- **OpenAI:** Used for the AI Assistant feature via Replit AI Integrations (specifically `gpt-4o`).
- **React Router DOM:** For client-side routing.
- **Tailwind CSS:** For utility-first styling.
- **Heroicons:** For UI icons.
- **React Hot Toast:** For notifications.
- **Express.js:** Used as a proxy server.
- **ExcelJS:** For generating styled Excel files.