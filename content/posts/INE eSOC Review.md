---
title: "INE eLearnSecurity Certified SOC Analyst (eSOC) Review"
emphasis: "Certified SOC Analyst (eSOC)"
published: 2026-11-10
description: My review of the eSOC exam and how to prepare for it.
cover: "./img/esoc/certificate.png"
tags: [eSOC, INE, Certification, SOC, Splunk, Wazuh, Wireshark, DFIR]
category: Certifications
credential:
  url: "https://certs.ine.com/dc7377c8-4cc9-4763-bb71-50d35c391f84#acc.qUJeZCLS"
  issuer: INE Security
  awarded: 19 Oct 2026
  id: "197673924"
draft: false
---

I recently passed INE's **eLearnSecurity Certified SOC Analyst (eSOC)**.

This post covers what the exam is like, what it rewards, and how to prepare. It contains no exam questions or answers, only the format and the skills you need.

## eSOC overview

eSOC is INE's entry-level **blue-team** certification, aimed at SOC analysts. I consider it a good starting point in the blue-team track of INE's certifications.

It is a **hands-on investigation exam**, not a memory test. You get a lab with alerts, a SIEM and packet captures, and you answer questions by finding evidence.

| | |
|---|---|
| Provider | INE Security |
| Level | Entry-level, blue team |
| Questions | 50: 15 general knowledge + 35 lab questions |
| Lab | 35 questions split into three phases, each its own incident |
| Time | 3 hours |
| Main tools | Splunk (SPL), Wazuh, Wireshark and TheHive |
| Price | $450 |

**In short:** if you can rebuild a full attack timeline (phishing → execution → discovery → lateral movement → impact) from Windows logs and a PCAP, you're ready.

## Pros

- **Practical.** Every lab answer has to be found in the data, so you can't pass by memorising.
- **Realistic.** Each phase is a full investigation: an alert in TheHive, logs in a SIEM (Splunk or Wazuh) and a packet capture, the way a real SOC works.
- **Covers more than one SIEM.** You work in both Splunk and Wazuh, not just one tool.
- **Rewards proof.** You need the right event to back an answer, not a guess from patterns.
- **Covers SOC judgment too.** Triage, escalation and scoping questions sit alongside the technical ones.
- **A good blue-team starting point.** If you come from SOC work or DFIR labs, the content will feel familiar.

## Cons

- **Price.** It costs **$450**, which I consider a little expensive. For less money you can get other certifications with harder exams and better value and recognition. In my case, my university provided it.
- **Time pressure.** Three hours is enough if your SPL and Wazuh filtering are fluent, but it runs out fast if you're fighting field names.

## Before the Exam

**I didn't take INE's course.** I prepared by practising on **HTB Sherlocks** and **CyberDefenders labs**, and that was enough. Investigation labs that give you a SIEM and a PCAP for the same incident are the best preparation.

What to revise:

- **Splunk:** counting and pivoting with `stats`, and reading raw events when fields don't extract.
- **Windows and Sysmon events:** which event proves a file was dropped and which proves it ran, plus logons and PowerShell logging.
- **Wazuh:** filtering by agent, sorting by rule level and reading the alert details.
- **Wireshark:** the statistics views, following streams and exporting objects.
- **Attack chains:** phishing, execution, discovery, lateral movement and ransomware, and how each step shows up in logs.
- **SOC judgment:** triage, escalation, containment and scoping.

## The exam

You have **3 hours for 50 questions**, a mix of multiple choice and free-text answers.

- **15 general knowledge questions.** SOC concepts and judgment, such as triage, escalation and scoping, with no lab lookup needed.
- **35 lab questions in three phases.** Each phase is a separate incident, on its own date, with its own data: alerts in **TheHive**, logs in a SIEM (**Splunk** or **Wazuh**) and a **packet capture**. Within a phase, **earlier findings feed later questions**.

What the lab tests:

- **Alert triage (TheHive).** Each phase starts from its alerts, and their hosts, IPs and users are your pivot points.
- **SIEM investigation (Splunk and Wazuh).** Going from "an alert fired" to "here's exactly what happened, on which hosts, and when".
- **Network forensics (Wireshark).** Reading traffic, extracting emails and files, and spotting C2 beaconing.
- **Threat intel.** Matching what you find to known attacker tools and infrastructure.

## Tips

1. **Set the time range first.** Lab data sits on the incident date, not in Splunk's default "Last 24 hours" window. Pick the exact day in Splunk's time picker and Wazuh's date filter, or use "All time". An empty search usually means a wrong time range, not missing evidence.
2. **Start each phase in TheHive.** The alerts tell you which hosts, IPs and users to pivot on in the SIEM and the PCAP.
3. **Read the question precisely.** "Delivered" is not "executed", and "initial host" is not "any host". The hardest part of the exam isn't the tools, it's reading what's actually asked.
4. **Prove it with the right event.** A dropped binary (Sysmon 11) is not a running binary (Sysmon 1 / 4688).
5. **Don't trust an empty result.** Zero results usually means a wrong field name or host filter, not "nothing happened". Field names are case-sensitive: `EventCode` is not `Eventcode`.
6. **Switch to Verbose mode and read `_raw`** when fields don't extract the way you expect.
7. **Clear your host and agent filters** from the previous search before drawing conclusions about the whole environment.
8. **Keep a timeline per phase.** By the end of a phase you'll want the attacker IP, the dropped filenames and the key timestamps in one place.
9. **Start Wireshark with the statistics views.** Protocol Hierarchy and Conversations answer half the network questions in seconds.
10. **Watch the clock.** 50 questions in 3 hours is about 3.5 minutes each, so don't sink 20 minutes into one question.

eSOC is a solid, practical certification. It rewards analysts who prove things with evidence and punishes careless reading. The real preparation is getting fast and precise with SPL, Wazuh filters and Wireshark on realistic incidents.

Next up for me: eCIR.
