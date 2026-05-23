# Huly Platform API Client Integration (TypeScript)

This repository demonstrates how to programmatically integrate with the **Huly Platform API** using the official TypeScript/JavaScript client library: `@hcengineering/api-client`.

It provides complete examples of using both the **WebSocket client** (persistent real-time connection) and the **REST client** (standard HTTP/JSON connection) to perform CRUD (Create, Read, Update, Delete) operations on Huly workspace entities (like Spaces and Issues).

---

## Features Showcase
- **Environment Setup**: Safely loads credentials from a local `.env` file via `dotenv`.
- **WebSocket Integration**: Connects via WebSockets for real-time CRUD lifecycle.
- **REST Integration**: Demonstrates both lightweight read-only queries (`connectRest`) and transactional write operations (`createRestTxOperations` wrapping HTTP POST requests).
- **Core Entities & Classes**: Showcases using `core:class:Space` and `tracker:class:Issue` to query and mutate data.

---

## Installation

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Huly Instance**: Either a self-hosted local instance (e.g., `http://localhost:8087`) or a workspace on the Huly Cloud (`https://huly.app`).

### Set Up Project
1. Install the workspace dependencies:
   ```bash
   npm install
   ```

2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and configure your credentials:
   - **`HULY_URL`**: Your Huly instance url (e.g., `https://huly.app` or `http://localhost:8087`).
   - **`HULY_WORKSPACE`**: The url name of your workspace. Find it in your browser address bar: `https://huly.app/workbench/<workspace-name>`.
   - **Authentication**: Either configure a personal access token (`HULY_TOKEN`) OR use your workbench email and password (`HULY_EMAIL` & `HULY_PASSWORD`).

---

## Running the Examples

### 1. WebSocket Client Example
To run the WebSocket CRUD lifecycle example:
```bash
npm run start:ws
```
This script will:
- Connect securely via WebSockets using `connect`.
- Query and log all active Spaces (projects) in the workspace.
- Create a test Issue (`tracker:class:Issue`) in the first available Space.
- Query, update, and finally clean up (delete) the test Issue.
- Properly close the WebSocket connection.

### 2. REST Client Example
To run the REST HTTP CRUD example:
```bash
npm run start:rest
```
This script will:
- Establish a standard HTTP connection using `connectRest`.
- Fetch logged-in account metadata.
- Fetch active Spaces in the workspace.
- Setup transactional write capabilities using `createRestTxOperations` over HTTP.
- Perform the complete create-read-update-delete cycle on a test Issue.

---

## How It Works Under the Hood

### WebSocket vs. REST Client
- **WebSocket client (`connect`)** holds a persistent bi-directional connection. It's recommended for long-running processes, real-time sync bots, and interactive applications that listen for state updates.
- **REST client (`connectRest`)** uses standard stateless HTTP requests, perfect for serverless endpoints, webhooks, or lightweight cron jobs.

### Transactions (`TxOperations`)
All data modifications (like creating, updating, and removing documents) in the Huly Platform are processed as transactions. 
- In the WebSocket client, transactional functions (`createDoc`, `updateDoc`, `removeDoc`) are exposed directly on the client.
- In the REST client, we utilize the `createRestTxOperations` helper to wrap the REST client with transaction management capabilities, enabling HTTP-based document mutation.

### Class Identifiers
Huly scopes data models using unique class references:
- **`core:class:Space`**: Workspace projects, document folders, or drives.
- **`tracker:class:Issue`**: Task cards used to organize development and workflows.
