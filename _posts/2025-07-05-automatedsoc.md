---
title: Building an Automated SOC with Open-Source Tools (Wazuh, VirusTotal, DFIR-IRIS, Shuffle)
time: 2025-07-05 12:00:00
categories: [Labs]
tags: [DFIR, SOC]
image: https://raw.githubusercontent.com/xDU00/blogstuff/refs/heads/main/archgeneral.png
---

# Building an Automated SOC with Open-Source Tools (Wazuh, VirusTotal, DFIR-IRIS, Shuffle)

This guide walks you through creating a next-generation Security Operations Center (SOC) using open-source tools: **Wazuh** for Security Information and Event Management (SIEM), **VirusTotal** for threat intelligence, **Shuffle** for Security Orchestration, Automation, and Response (SOAR), and **DFIR-IRIS** for incident management and collaboration. By integrating these tools, you can automate threat detection, enrichment, and response, significantly improving SOC efficiency. This setup is based on a real-world project implemented.
## Why Automate a SOC?

Modern cybersecurity threats are frequent and sophisticated, overwhelming traditional SOCs with alert fatigue, manual processes, and delayed responses. A next-generation SOC leverages automation, orchestration, and threat intelligence to:
- **Enhance Visibility**: Monitor endpoints, networks, and cloud environments in real-time.
- **Reduce Response Time**: Automate repetitive tasks like alert triage and incident escalation.
- **Improve Accuracy**: Enrich alerts with threat intelligence to reduce false positives.
- **Ensure Compliance**: Maintain audit logs and centralized reporting for regulations like GDPR and PCI DSS.

This guide provides a step-by-step approach to building such a system, including setup, configuration, integration, and testing with a realistic attack scenario, complete with screenshots to illustrate key steps.

## Tools Overview

### 1. Wazuh (SIEM)
- **Purpose**: Real-time log collection, analysis, and alert generation.
- **Key Features**:
  - Collects logs from endpoints (Windows, Linux) and network devices.
  - Detects anomalies using behavioral analytics and predefined rules.
  - Provides a web-based dashboard (via Kibana) for visualization.
- **Why Chosen**: Open-source, scalable, and integrates well with other tools.

### 2. VirusTotal (Threat Intelligence)
- **Purpose**: Enriches alerts with data from over 70 antivirus engines and threat databases.
- **Key Features**:
  - Analyzes files, URLs, IPs, and domains for malicious content.
  - Offers API support for seamless integration.
- **Why Chosen**: Comprehensive threat intelligence with robust API for automation.

### 3. Shuffle (SOAR)
- **Purpose**: Automates workflows and orchestrates tool integration.
- **Key Features**:
  - Visual workflow builder for creating automated response pipelines.
  - Supports integrations with Wazuh, VirusTotal, and IRIS via APIs.
- **Why Chosen**: Open-source, lightweight, and flexible for custom workflows.

### 4. DFIR-IRIS (Incident Management)
- **Purpose**: Manages incident tickets, evidence collection, and team collaboration.
- **Key Features**:
  - Tracks incident lifecycle with timelines and task assignments.
  - Integrates with Wazuh for automated ticket creation.
- **Why Chosen**: Open-source platform designed for digital forensics and incident response.

## Prerequisites

Before starting, ensure you have:
- A virtual machine (VM) with:
  - **OS**: Ubuntu 20.04 LTS (Kernel 5.15 or later)
  - **CPU**: 6 cores
  - **Memory**: 32 GB
  - **Storage**: 466 GB
- Docker and Docker Compose installed on the VM.
- A test environment with Windows 10 and Ubuntu endpoints for monitoring.
## Step-by-Step Setup Guide

### Step 1: Set Up the Virtual Environment
1. **Create a Virtual Machine**:
   - Use a hypervisor like VMware Workstation to create a VM with the specifications above.
   - Install Ubuntu 20.04 LTS and update the system:
     ```bash
     sudo apt update && sudo apt upgrade -y
     ```
2. **Install Docker and Docker Compose**:
   - Follow the official Docker installation guide for Ubuntu:
     ```bash
     sudo apt install docker.io docker-compose -y
     sudo systemctl enable docker
     sudo systemctl start docker
     ```
   - Verify installation:
     ```bash
     docker --version
     docker-compose --version
     ```

### Step 2: Install and Configure Wazuh
1. **Pull Wazuh Docker Images**:
   - Use the official Wazuh Docker repository:
     ```bash
     docker pull wazuh/wazuh-manager:4.9.2
     docker pull wazuh/wazuh-indexer:4.9.2
     docker pull wazuh/wazuh-dashboard:4.9.2
     ```
2. **Configure Docker Compose**:
   - Create a `docker-compose.yml` file for Wazuh:
     ```yaml
     version: '3'
     services:
       wazuh-manager:
         image: wazuh/wazuh-manager:4.9.2
         hostname: wazuh-manager
         restart: always
         networks:
           - wazuh
       wazuh-indexer:
         image: wazuh/wazuh-indexer:4.9.2
         hostname: wazuh-indexer
         restart: always
         networks:
           - wazuh
       wazuh-dashboard:
         image: wazuh/wazuh-dashboard:4.9.2
         hostname: wazuh-dashboard
         restart: always
         networks:
           - wazuh
         ports:
           - "443:5601"
     networks:
       wazuh:
         driver: bridge
     ```
   - **Explanation**: Maps the Wazuh dashboard to port 443 (HTTPS) for secure access, internally using port 5601.
   - **Screenshot**:

3. **Launch Wazuh**:
   - Run the services in detached mode:
     ```bash
     docker-compose up -d
     ```
   - Verify containers are running:
     ```bash
     docker ps
     ```
4. **Install Wazuh Agents**:
   - On each endpoint (Windows 10 and Ubuntu), download and install the Wazuh agent:
     - **Windows**: Download the agent from [Wazuh](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/windows.html) and follow the GUI installer.
     - **Ubuntu**:
       ```bash
       wget https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.9.2-1_amd64.deb
       sudo dpkg -i wazuh-agent_4.9.2-1_amd64.deb
       ```
   - Enroll agents with the Wazuh Manager:
     ```bash
     sudo /var/ossec/bin/manage_agents -i <MANAGER_IP>
     ```
   - Verify agent status in the Wazuh Dashboard:


### Step 3: Install and Configure DFIR-IRIS
1. **Pull IRIS Docker Images**:
   - Use the official IRIS Docker repository:
     ```bash
     docker pull dfiriris/iris-web-app:latest
     ```
2. **Configure Docker Compose**:
   - Create a `docker-compose.yml` file for IRIS:
     ```yaml
     version: '3'
     services:
       iris_db:
         image: postgres:13
         environment:
           - POSTGRES_USER=iris
           - POSTGRES_PASSWORD=iris_password
           - POSTGRES_DB=iris
         networks:
           - iris_network
       iris_webapp:
         image: dfiriris/iris-web-app:latest
         depends_on:
           - iris_db
         ports:
           - "8443:443"
         environment:
           - DB_HOST=iris_db
           - DB_USER=iris
           - DB_PASSWORD=iris_password
           - DB_NAME=iris
         networks:
           - iris_network
       iris_rabbitmq:
         image: rabbitmq:3-management
         networks:
           - iris_network
       iris_worker:
         image: dfiriris/iris-web-app:latest
         depends_on:
           - iris_db
           - iris_rabbitmq
         environment:
           - DB_HOST=iris_db
           - DB_USER=iris
           - DB_PASSWORD=iris_password
           - DB_NAME=iris
         networks:
           - iris_network
     networks:
       iris_network:
         driver: bridge
     ```
   - **Explanation**: Maps the IRIS web interface to port 8443 (HTTPS) for secure access.
3. **Launch IRIS**:
   - Run the services:
     ```bash
     docker-compose up -d
     ```
   - Verify containers are running:

   - Access the IRIS web interface at `https://<VM_IP>:8443`.
4. **Integrate with Wazuh**:
   - Create a script to automate Wazuh-IRIS integration:
     ```bash
     #!/bin/bash
     # File: integrate_wazuh_iris.sh
     echo "Enter IRIS API Key:"
     read IRIS_API_KEY
     echo "Enter IRIS URL (e.g., https://<VM_IP>:8443):"
     read IRIS_URL
     cat <<EOF >> /var/ossec/etc/ossec.conf
     <ossec_config>
       <integration>
         <name>iris</name>
         <api_key>$IRIS_API_KEY</api_key>
         <hook_url>$IRIS_URL/api/case</hook_url>
         <alert_format>json</alert_format>
       </integration>
     </ossec_config>
     EOF
     sudo docker-compose restart
     ```
   - Run the script:
     ```bash
     chmod +x integrate_wazuh_iris.sh
     ./integrate_wazuh_iris.sh
     ```
   - **Screenshot**:


### Step 4: Install and Configure Shuffle
1. **Pull Shuffle Docker Images**:
   - Use the official Shuffle Docker repository:
     ```bash
     docker pull shuffler/shuffle-backend:latest
     docker pull shuffler/shuffle-frontend:latest
     docker pull shuffler/shuffle-opensearch:latest
     docker pull shuffler/shuffle-orborus:latest
     ```
2. **Configure Docker Compose**:
   - Create a `docker-compose.yml` file for Shuffle:
     ```yaml
     version: '3'
     services:
       shuffle-backend:
         image: shuffler/shuffle-backend:latest
         hostname: shuffle-backend
         restart: always
         environment:
           - BASE_URL=http://shuffle-backend:5001
           - BACKEND_PORT=5001
         networks:
           - shuffle_network
       shuffle-frontend:
         image: shuffler/shuffle-frontend:latest
         hostname: shuffle-frontend
         restart: always
         ports:
           - "3443:3001"
         environment:
           - FRONTEND_PORT_HTTPS=3443
         networks:
           - shuffle_network
       shuffle-opensearch:
         image: shuffler/shuffle-opensearch:latest
         hostname: shuffle-opensearch
         restart: always
         networks:
           - shuffle_network
       shuffle-orborus:
         image: shuffler/shuffle-orborus:latest
         hostname: shuffle-orborus
         restart: always
         networks:
           - shuffle_network
     networks:
       shuffle_network:
         driver: bridge
     ```
   - **Explanation**: Maps the Shuffle frontend to port 3443 (HTTPS) and backend to port 5001.
3. **Configure Environment File**:
   - Create an `env` file in the Shuffle directory:
     ```bash
     BASE_URL=http://shuffle-backend:5001
     SSO_REDIRECT_URL=http://localhost:3001
     BACKEND_HOSTNAME=shuffle-backend
     BACKEND_PORT=5001
     FRONTEND_PORT=3001
     FRONTEND_PORT_HTTPS=3443
     ```
   - **Screenshot**:

4. **Launch Shuffle**:
   - Run the services:
     ```bash
     docker-compose up -d
     ```
   - Verify containers are running:

   - Access the Shuffle web interface at `https://<VM_IP>:3443`.
5. **Integrate with Wazuh**:
   - Create a script to configure webhook notifications:
     ```bash
     #!/bin/bash
     # File: integrate_shuffle_wazuh.sh
     echo "Enter Shuffle Hook URL (e.g., https://<VM_IP>:3443/hooks/wazuh):"
     read SHUFFLE_URL
     cat <<EOF >> /var/ossec/etc/ossec.conf
     <ossec_config>
       <integration>
         <name>shuffle</name>
         <hook_url>$SHUFFLE_URL</hook_url>
         <level>3</level>
         <alert_format>json</alert_format>
       </integration>
     </ossec_config>
     EOF
     sudo docker-compose restart
     ```
   - Run the script:
     ```bash
     chmod +x integrate_shuffle_wazuh.sh
     ./integrate_shuffle_wazuh.sh
     ```
   - **Screenshot**:

6. **Integrate with IRIS and VirusTotal**:
   - In the Shuffle web interface, create a workflow:
     - **Trigger**: Configure a Wazuh webhook trigger (use the hook URL from above).
     - **Actions**:
       - Add a VirusTotal module to query file hashes (configure with your VirusTotal API key).
       - Add an IRIS module to create cases (configure with IRIS API key and URL).
       - Add an email module to notify the SOC team (configure with SMTP settings).
   - Example JSON for IRIS case creation:
     ```json
     {
       "case_customer": "1",
       "case_description": "${create_alert.body.data.alert_description}",
       "case_name": "${exec.title}",
       "soc_id": "shuffler2",
       "case_id": "1"
     }
     ```
   - **Screenshots**:
   

### Step 5: Test the SOC with a Mimikatz Attack Scenario
To validate the automated SOC, simulate a credential-dumping attack using Mimikatz, a common post-exploitation tool.

1. **Set Up Test Environment**:
   - Deploy a Windows 10 VM with the Wazuh agent installed.
   - Download Mimikatz from a trusted source (e.g., GitHub) for testing purposes only.
   - **Screenshot**:


2. **Configure Wazuh Detection Rules**:
   - Edit `/var/ossec/etc/rules/local_rules.xml` on the Wazuh Manager:
     ```xml
     <group name="mimikatz,">
       <rule id="100000" level="12">
         <if_group>sysmon_event1</if_group>
         <field name="win.eventdata.image">mimikatz.exe</field>
         <description>Mimikatz executable detected</description>
       </rule>
       <rule id="100001" level="12">
         <if_group>sysmon_event1</if_group>
         <field name="win.eventdata.targetObject">lsass.exe</field>
         <description>Suspicious access to LSASS process</description>
       </rule>
       <rule id="100002" level="12">
         <if_group>sysmon_event1</if_group>
         <field name="win.eventdata.callTrace">mimikatz</field>
         <description>Mimikatz-related call trace detected</description>
       </rule>
     </group>
     ```
   - Restart Wazuh services:
     ```bash
     sudo docker-compose restart
     ```
   - **Screenshot**:
     

3. **Run Mimikatz**:
   - Execute Mimikatz on the Windows 10 VM (e.g., `mimikatz.exe` in a test directory).
   - This triggers the Wazuh agent to detect suspicious activity.

4. **Verify Workflow**:

5. **Analyze Results**:
   - The workflow should complete in ~23 seconds, from detection to notification.
   - IRIS should log the incident with a timeline, evidence, and task assignments:
    

## Conclusion
This automated SOC leverages Wazuh, VirusTotal, Shuffle, and DFIR-IRIS to create a robust, scalable, and efficient cybersecurity framework. The Mimikatz test scenario demonstrates its ability to detect, enrich, and respond to threats in real-time, reducing manual effort and response times. By following this guide and including the provided screenshots, you can replicate this setup for your organization, enhancing your cybersecurity posture with open-source tools.

For further details, refer to the official documentation:
- [Wazuh](https://documentation.wazuh.com/current/)
- [VirusTotal](https://docs.virustotal.com/docs/how-it-works)
- [Shuffle](https://shuffler.io/)
- [DFIR-IRIS](https://docs.dfir-iris.org/latest/)

Happy hacking, and stay secure!

xDU0
