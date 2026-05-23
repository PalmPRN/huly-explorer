# Huly Integration Setup Guide

This guide describes how to configure and run the Huly Platform interactive CLI dashboard and exporter on macOS, Linux, and Windows.

---

## 📋 Prerequisites

Before setting up the project, make sure you have installed:
1. **Node.js** (v18 or higher recommended)
2. **Access to a Huly instance** (either cloud-hosted at `https://huly.app` or a self-hosted local instance).

---

## 🛠️ Step-by-Step Installation

### 1. Configure the Environment Credentials
The integration requires a [.env](file:///Users/phiriya.ntmp/work/huly-integrate/.env) configuration file in the project root to authenticate with Huly.

1. Locate the configuration template [.env.example](file:///Users/phiriya.ntmp/work/huly-integrate/.env.example).
2. Copy it to create a [.env](file:///Users/phiriya.ntmp/work/huly-integrate/.env) file:
   - **macOS/Linux**:
     ```bash
     cp .env.example .env
     ```
   - **Windows**:
     ```cmd
     copy .env.example .env
     ```
3. Open [.env](file:///Users/phiriya.ntmp/work/huly-integrate/.env) in your text editor and update the following values:
   - `HULY_URL`: Set to your Huly server URL (e.g., `https://huly.app` or `http://localhost:8087`).
   - `HULY_WORKSPACE`: Specify the active workspace ID (found in your browser url bar, e.g., `https://huly.app/workbench/your-workspace-id`).
   - `HULY_TOKEN`: Put your Personal Access Token. (Alternatively, you can provide `HULY_EMAIL` and `HULY_PASSWORD` instead of the token).

---

## 🚀 Running the Interactive CLI Dashboard

We have provided automated launcher scripts for macOS/Linux and Windows to verify requirements, install dependencies, and run the dashboard in a single command.

### macOS & Linux
Run the shell script [run.sh](file:///Users/phiriya.ntmp/work/huly-integrate/run.sh):
```bash
./run.sh
```
*(The script will automatically check for Node.js, create `.env` if missing, run `npm install` if needed, and boot up the CLI.)*

### Windows
Run the batch file [run.bat](file:///Users/phiriya.ntmp/work/huly-integrate/run.bat) from Command Prompt (`cmd`) or double-click it:
```cmd
run.bat
```
*(Similarly, this will verify node dependencies, copy the `.env` template, and launch the CLI dashboard.)*

---

## 📂 Core Project Components

Here are the main files that power this integration:

* **[src/cli.ts](file:///Users/phiriya.ntmp/work/huly-integrate/src/cli.ts)**: The primary entry point for the terminal CLI. Handles interactive dropdown selectors, filtered queries, rendering the issue preview table, and exporting to CSV.
* **[src/export-csv.ts](file:///Users/phiriya.ntmp/work/huly-integrate/src/export-csv.ts)**: A standalone script to export issues from the Dev Team matching Sprint MAY to a predefined standard CSV template.
* **[src/config.ts](file:///Users/phiriya.ntmp/work/huly-integrate/src/config.ts)**: Reads, validates, and exposes configuration parameters from [.env](file:///Users/phiriya.ntmp/work/huly-integrate/.env).
* **[package.json](file:///Users/phiriya.ntmp/work/huly-integrate/package.json)**: Declares project metadata, external dependencies (`@hcengineering/api-client`, `prompts`, `chalk`, `cli-table3`), and runner script definitions.
