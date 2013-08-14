"use strict";

var term, pc, boot_start_time;

function term_start() {
    term = new Term(80, 30, term_handler);
    term.open();
}

function term_handler(str) {
    pc.serial.send_chars(str);
}

function clipboard_set(val) {
    var el;
    el = document.getElementById("text_clipboard");
    el.value = val;
}

function clipboard_get() {
    var el;
    el = document.getElementById("text_clipboard");
    return el.value;
}

function clear_clipboard() {
    var el;
    el = document.getElementById("text_clipboard");
    el.value = "";
}

function get_boot_time() {
    return +(new Date) - boot_start_time;
}

function start() {
    var start_addr, initrd_size, params, cmdline_addr;
    params = new Object;
    params.serial_write = term.write.bind(term);
    params.mem_size = 16 * 1024 * 1024;
    params.clipboard_get = clipboard_get;
    params.clipboard_set = clipboard_set;
    params.get_boot_time = get_boot_time;
    pc = new PCEmulator(params);
    pc.load_binary("vmlinux26.bin", 1048576);
    initrd_size = pc.load_binary("root.bin", 4194304);
    start_addr = 65536;
    pc.load_binary("linuxstart.bin", start_addr);
    cmdline_addr = 63488;
    pc.cpu.write_string(cmdline_addr, "console=ttyS0 root=/dev/ram0 rw init=/sbin/init notsc=1");
    pc.cpu.eip = start_addr;
    pc.cpu.regs[0] = params.mem_size;
    pc.cpu.regs[3] = initrd_size;
    pc.cpu.regs[1] = cmdline_addr;
    boot_start_time = +(new Date);
    pc.start();
}

term_start();