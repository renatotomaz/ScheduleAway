# ScheduleAway

An efficient tool to manage and track absences, time-offs, and schedules seamlessly. Simplify your scheduling needs with ease and flexibility.

## Overview
This project is a Node.js-based server application designed to help with managing schedules. Below are the steps for setting up, running, and managing the project, including important details about compilation and execution.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Compilation and Execution](#compilation-and-execution)
4. [Manual Task Automation](#manual-task-automation)
5. [Nginx Configuration](#nginx-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: Ensure Node.js is installed. Recommended version: 16.x or later.
- **NPM or Yarn**: Package manager for Node.js.
- **Nginx**: To act as a reverse proxy (if necessary).
- **Windows Server or Linux**: Tested on a Windows Server with VPN connectivity.

---

## Project Setup

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd ScheduleAway

2. **Install Dependencies:**
    ```bash
   npm install
   npm install gulp gulp-cli gulp-copy --save-dev
   npm install -g nodemon


3. **Compilation and Execution:**
*Running in Development  Mode*
    ```bash
    npm run dev

*Compilation*
The project is written in TypeScript. To compile it into JavaScript:

1. Install TypeScript globally (if not already installed):
    ```bash
    npm install -g typescript

2. Compile the project:
    ```bash
    tsc

This will generate the compiled files in the dist directory.

*Execution*
Running in Production Mode (Standard)
Navigate to the dist directory:
    ```bash
    node server.js


4. **Manual Task Automation**

Create a .bat file with the following content:
    ```bash
        tsc
    @echo off
    "C:\Program Files\nodejs\node.exe" "<yourPath>\ScheduleAway\dist\server.js"

Save it as start-server.bat.

Use the Windows Task Scheduler to run this script automatically at login or startup.

5. **Nginx Configuration:**
Example Nginx configuration for proxying to the server:

        ```bash

            server {
                listen       80;
                server_name  localhost;

                location / {
                    proxy_pass http://localhost:8085/;
                }

                error_page   500 502 503 504  /50x.html;
                location = /50x.html {
                    root   html;
                }
            }

Reload Nginx
After updating the configuration, reload Nginx:

        ```bash
        sudo nginx -s reload

6. **Troubleshooting:**
To be done