---
# Everything on the About page (the site's front page) is edited here.
# Text fields accept inline Markdown: **bold**, *italic*, [links](https://...).

name: Hilmi Ouelhazi
handle: xDU0

headline: ~/*whoami*
byline: "**Hilmi Ouelhazi** (xDU0). Cybersecurity analyst and Master student. CTF Player with [Phr34k$](https://ctftime.org/team/278448/)."
intro: I share my experiences, write-ups, and personal achievements. Stay tuned for regular updates and feel free to connect with me!

doing:
  - lead: SOC & IR.
    text: SIEM, SOAR, threat intel
  - lead: Forensics.
    text: Network, Windows, registry
  - lead: Offensive.
    text: Web testing, CTFs
  - lead: Automation.
    text: Python, FastAPI

# Experience, newest first
experience:
  - role: Network Administrator / IT Support
    org: CybershieldTN
    dates: Aug 2025 – Dec 2025
    text: Configured and troubleshot switches, access points, firewalls, Active Directory and virtualized servers. Handled support requests and SLA tracking through ticketing tools.
    tags: [Networking, Firewalls, Active Directory, Virtualization]
  - role: SOC Analyst
    org: J’économise.fr
    dates: Jan 2025 – Jul 2025
    text: Monitored and investigated security alerts in Wazuh and OpenSearch, and integrated Shuffle, DFIR-IRIS, MISP and VirusTotal to automate IOC enrichment and incident response.
    tags: [Wazuh, OpenSearch, Shuffle, DFIR-IRIS, MISP]
  - role: Web Application Security Intern
    org: Defensy Lab
    dates: Jan 2024
    text: Supported web application security testing and vulnerability assessments.
    tags: [Web app testing, Vulnerability assessment]

# Education, newest first
education:
  - degree: Cybersecurity studies
    school: Tekup University
    dates: 2026 – present
  - degree: Master’s studies in Information Systems Security (SSI)
    school: Institut Supérieur de Gestion (ISG)
    dates: 2025 – 2026
  - degree: Bachelor’s degree in Computer Networks and Systems
    school: ISET Charguia
    dates: 2022 – 2025

# Project cards. image = file in content/projects/
projects:
  - title: TriageLens
    repo: xDU00/triagelens
    url: https://github.com/xDU00/triagelens
    image: triagelens.png
    accent: "#2f9e8f"
    text: Evidence-grounded, AI-assisted alert triage for Wazuh. A browser sidebar and FastAPI service that turn a selected alert into a verdict, severity, verified evidence, MITRE ATT&CK mappings and safe next steps.
    tags: [Python, FastAPI, Browser extension, Wazuh, Ollama, SQLite]
  - title: Automated SOC
    repo: xDU00/Automated-SOC
    url: https://github.com/xDU00/Automated-SOC
    image: automated-soc.png
    fit: contain
    accent: "#3b6fd1"
    text: A SOC built from open-source tools. Wazuh detects, VirusTotal enriches, Shuffle automates and DFIR-IRIS tracks the case, tested end to end with a Mimikatz scenario.
    tags: [Wazuh, Shuffle, DFIR-IRIS, VirusTotal, Docker]
  - title: Securinets ISGT CTF 2026
    repo: securinets-isgt/securinetsisgt-ctf-2026-archive
    url: https://github.com/securinets-isgt/securinetsisgt-ctf-2026-archive
    image: securinets-ctf-2026.png
    accent: "#b5213f"
    text: Public archive of the Securinets ISGT CTF 2026 platform. CTFd with a custom Batman/Riddler theme, plugins, challenge assets and a Discord first-blood bot.
    tags: [CTFd, Python, Flask, Discord bot, Nginx]

# Certificates. status: done | progress. image = file in content/certs/ (optional)
certificates:
  - name: eSOC — Security Operations Certified
    issuer: INE Security
    status: done
    date: Oct 2026
    image: esoc.png
    url: https://certs.ine.com/dc7377c8-4cc9-4763-bb71-50d35c391f84
  - name: Certified Ethical Hacker (CEH) v13
    short: CEH v13
    issuer: EC-Council
    status: progress

# Achievements. place: 1st | 2nd | 3rd | Winner
achievements:
  team: Phr34k$
  team_url: https://ctftime.org/team/278448/
  podiums:
    - place: 3rd
      event: Hack The Future
      year: 2026
    - place: Winner
      event: Game Jam
      year: 2024
    - place: 3rd
      event: GDSC CTF
      year: 2023
    - place: 1st
      event: Cybermaze CTF
      year: 2022
  finals:
    - event: Securinets Finals
      years: [2024, 2025, 2026]

contact:
  GitHub: https://github.com/xDU00
  LinkedIn: https://www.linkedin.com/in/hilmi-ouelhazi/
  Discord: xduo28_
---
