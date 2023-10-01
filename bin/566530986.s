.data
.string:
.string "my bum smell!\n"
string:
.quad .string
.text
.globl _start
_prints:
PUSHQ %rbp
MOVQ %rsp, %rbp
MOVQ %rdi, -8(%rbp)
XOR %rcx, %rcx
NOT %rcx
XOR %al,%al
CLD
REPNZ scasb
NOT %rcx
DEC %rcx
MOVQ %rcx,%rdx
MOVQ -8(%rbp), %rsi
MOVQ $1, %rax
MOVQ %rax, %rdi
SYSCALL
POPQ %rbp
RET
_printd:
MOVQ %rdi, %rax
MOVQ $10, %rcx
PUSHQ %rcx
MOVQ %rsp, %rsi
SUBQ $16, %rsp
.toascii_digit:
XOR %rdx, %rdx
DIVQ %rcx
ADDQ $48, %rdx
DEC %rsi
MOV %dl, (%rsi)
TEST %rax, %rax
JNZ .toascii_digit
MOVQ $1, %rax
MOVQ $1, %rdi
LEAQ 16(%rsp), %rdx
SUBQ %rsi,%rdx
SYSCALL
ADDQ $24, %rsp
RET
_start:
PUSHQ %rbp
MOVQ %rsp, %rbp
MOVQ string, %rdi
CALL _prints
MOVQ $60, %rax
XOR %rdi, %rdi
syscall
