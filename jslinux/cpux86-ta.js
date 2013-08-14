"use strict";

var aa = [ 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1 ];

var ba = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ];

var ca = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4 ];

function CPU_X86() {
    var i, da;
    this.regs = new Array;
    for (i = 0; i < 8; i++) this.regs[i] = 0;
    this.eip = 0;
    this.cc_op = 0;
    this.cc_dst = 0;
    this.cc_src = 0;
    this.cc_op2 = 0;
    this.cc_dst2 = 0;
    this.df = 1;
    this.eflags = 2;
    this.cycle_count = 0;
    this.hard_irq = 0;
    this.hard_intno = -1;
    this.cpl = 0;
    this.cr0 = 1 << 0;
    this.cr2 = 0;
    this.cr3 = 0;
    this.cr4 = 0;
    this.idt = {
        base: 0,
        limit: 0
    };
    this.gdt = {
        base: 0,
        limit: 0
    };
    this.segs = new Array;
    for (i = 0; i < 6; i++) {
        this.segs[i] = {
            selector: 0,
            base: 0,
            limit: 0,
            flags: 0
        };
    }
    this.tr = {
        selector: 0,
        base: 0,
        limit: 0,
        flags: 0
    };
    this.ldt = {
        selector: 0,
        base: 0,
        limit: 0,
        flags: 0
    };
    this.halted = 0;
    this.phys_mem = null;
    da = 1048576;
    this.tlb_read_kernel = new Int32Array(da);
    this.tlb_write_kernel = new Int32Array(da);
    this.tlb_read_user = new Int32Array(da);
    this.tlb_write_user = new Int32Array(da);
    for (i = 0; i < da; i++) {
        this.tlb_read_kernel[i] = -1;
        this.tlb_write_kernel[i] = -1;
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
    this.tlb_pages = new Int32Array(2048);
    this.tlb_pages_count = 0;
}

CPU_X86.prototype.phys_mem_resize = function(ea) {
    this.mem_size = ea;
    ea += 15 + 3 & ~3;
    this.phys_mem = new ArrayBuffer(ea);
    this.phys_mem8 = new Uint8Array(this.phys_mem, 0, ea);
    this.phys_mem16 = new Uint16Array(this.phys_mem, 0, ea / 2);
    this.phys_mem32 = new Int32Array(this.phys_mem, 0, ea / 4);
};

CPU_X86.prototype.ld8_phys = function(fa) {
    return this.phys_mem8[fa];
};

CPU_X86.prototype.st8_phys = function(fa, ga) {
    this.phys_mem8[fa] = ga;
};

CPU_X86.prototype.ld32_phys = function(fa) {
    return this.phys_mem32[fa >> 2];
};

CPU_X86.prototype.st32_phys = function(fa, ga) {
    this.phys_mem32[fa >> 2] = ga;
};

CPU_X86.prototype.tlb_set_page = function(fa, ha, ia, ja) {
    var i, ga, j;
    ha &= -4096;
    fa &= -4096;
    ga = fa ^ ha;
    i = fa >>> 12;
    if (this.tlb_read_kernel[i] == -1) {
        if (this.tlb_pages_count >= 2048) {
            this.tlb_flush_all1(i - 1 & 1048575);
        }
        this.tlb_pages[this.tlb_pages_count++] = i;
    }
    this.tlb_read_kernel[i] = ga;
    if (ia) {
        this.tlb_write_kernel[i] = ga;
    } else {
        this.tlb_write_kernel[i] = -1;
    }
    if (ja) {
        this.tlb_read_user[i] = ga;
        if (ia) {
            this.tlb_write_user[i] = ga;
        } else {
            this.tlb_write_user[i] = -1;
        }
    } else {
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
};

CPU_X86.prototype.tlb_flush_page = function(fa) {
    var i;
    i = fa >>> 12;
    this.tlb_read_kernel[i] = -1;
    this.tlb_write_kernel[i] = -1;
    this.tlb_read_user[i] = -1;
    this.tlb_write_user[i] = -1;
};

CPU_X86.prototype.tlb_flush_all = function() {
    var i, j, n, ka;
    ka = this.tlb_pages;
    n = this.tlb_pages_count;
    for (j = 0; j < n; j++) {
        i = ka[j];
        this.tlb_read_kernel[i] = -1;
        this.tlb_write_kernel[i] = -1;
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
    this.tlb_pages_count = 0;
};

CPU_X86.prototype.tlb_flush_all1 = function(la) {
    var i, j, n, ka, ma;
    ka = this.tlb_pages;
    n = this.tlb_pages_count;
    ma = 0;
    for (j = 0; j < n; j++) {
        i = ka[j];
        if (i == la) {
            ka[ma++] = i;
        } else {
            this.tlb_read_kernel[i] = -1;
            this.tlb_write_kernel[i] = -1;
            this.tlb_read_user[i] = -1;
            this.tlb_write_user[i] = -1;
        }
    }
    this.tlb_pages_count = ma;
};

CPU_X86.prototype.write_string = function(fa, na) {
    var i;
    for (i = 0; i < na.length; i++) {
        this.st8_phys(fa++, na.charCodeAt(i) & 255);
    }
    this.st8_phys(fa, 0);
};

function oa(ga, n) {
    var i, s;
    var h = "0123456789ABCDEF";
    s = "";
    for (i = n - 1; i >= 0; i--) {
        s = s + h[ga >>> i * 4 & 15];
    }
    return s;
}

function pa(n) {
    return oa(n, 8);
}

function qa(n) {
    return oa(n, 2);
}

function ra(n) {
    return oa(n, 4);
}

CPU_X86.prototype.dump = function() {
    var i, sa, na;
    var ta = [ " ES", " CS", " SS", " DS", " FS", " GS", "LDT", " TR" ];
    console.log("TSC=" + pa(this.cycle_count) + " EIP=" + pa(this.eip) + "\nEAX=" + pa(this.regs[0]) + " ECX=" + pa(this.regs[1]) + " EDX=" + pa(this.regs[2]) + " EBX=" + pa(this.regs[3]) + " ESP=" + pa(this.regs[4]) + " EBP=" + pa(this.regs[5]));
    console.log("ESI=" + pa(this.regs[6]) + " EDI=" + pa(this.regs[7]));
    console.log("EFL=" + pa(this.eflags) + " OP=" + qa(this.cc_op) + " SRC=" + pa(this.cc_src) + " DST=" + pa(this.cc_dst) + " OP2=" + qa(this.cc_op2) + " DST2=" + pa(this.cc_dst2));
    console.log("CPL=" + this.cpl + " CR0=" + pa(this.cr0) + " CR2=" + pa(this.cr2) + " CR3=" + pa(this.cr3) + " CR4=" + pa(this.cr4));
    na = "";
    for (i = 0; i < 8; i++) {
        if (i == 6) sa = this.ldt; else if (i == 7) sa = this.tr; else sa = this.segs[i];
        na += ta[i] + "=" + ra(sa.selector) + " " + pa(sa.base) + " " + pa(sa.limit) + " " + ra(sa.flags >> 8 & 61695);
        if (i & 1) {
            console.log(na);
            na = "";
        } else {
            na += " ";
        }
    }
    sa = this.gdt;
    na = "GDT=     " + pa(sa.base) + " " + pa(sa.limit) + "      ";
    sa = this.idt;
    na += "IDT=     " + pa(sa.base) + " " + pa(sa.limit);
    console.log(na);
};

CPU_X86.prototype.exec_internal = function(ua, va) {
    var wa, fa, xa;
    var ya, za, Aa, Ba, Ca;
    var Da, Ea, Fa, b, Ga, ga, Ha, Ia, Ja, Ka, La, Ma;
    var Na, Oa;
    var Pa, Qa;
    var Ra, Sa, Ta, Ua, Va, Wa;
    function Xa() {
        var Ya;
        Za(fa, 0, wa.cpl == 3);
        Ya = Va[fa >>> 12] ^ fa;
        return Na[Ya];
    }
    function ab() {
        var Oa;
        return (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
    }
    function bb() {
        var ga;
        ga = ab();
        fa++;
        ga |= ab() << 8;
        fa--;
        return ga;
    }
    function cb() {
        var Oa;
        return ((Oa = Va[fa >>> 12]) | fa) & 1 ? bb() : Pa[(fa ^ Oa) >> 1];
    }
    function db() {
        var ga;
        ga = ab();
        fa++;
        ga |= ab() << 8;
        fa++;
        ga |= ab() << 16;
        fa++;
        ga |= ab() << 24;
        fa -= 3;
        return ga;
    }
    function eb() {
        var Oa;
        return ((Oa = Va[fa >>> 12]) | fa) & 3 ? db() : Qa[(fa ^ Oa) >> 2];
    }
    function fb() {
        var Ya;
        Za(fa, 1, wa.cpl == 3);
        Ya = Wa[fa >>> 12] ^ fa;
        return Na[Ya];
    }
    function gb() {
        var Ya;
        return (Ya = Wa[fa >>> 12]) == -1 ? fb() : Na[fa ^ Ya];
    }
    function hb() {
        var ga;
        ga = gb();
        fa++;
        ga |= gb() << 8;
        fa--;
        return ga;
    }
    function ib() {
        var Ya;
        return ((Ya = Wa[fa >>> 12]) | fa) & 1 ? hb() : Pa[(fa ^ Ya) >> 1];
    }
    function jb() {
        var ga;
        ga = gb();
        fa++;
        ga |= gb() << 8;
        fa++;
        ga |= gb() << 16;
        fa++;
        ga |= gb() << 24;
        fa -= 3;
        return ga;
    }
    function kb() {
        var Ya;
        return ((Ya = Wa[fa >>> 12]) | fa) & 3 ? jb() : Qa[(fa ^ Ya) >> 2];
    }
    function lb(ga) {
        var Ya;
        Za(fa, 1, wa.cpl == 3);
        Ya = Wa[fa >>> 12] ^ fa;
        Na[Ya] = ga;
    }
    function mb(ga) {
        var Oa;
        {
            Oa = Wa[fa >>> 12];
            if (Oa == -1) {
                lb(ga);
            } else {
                Na[fa ^ Oa] = ga;
            }
        }
    }
    function nb(ga) {
        mb(ga);
        fa++;
        mb(ga >> 8);
        fa--;
    }
    function ob(ga) {
        var Oa;
        {
            Oa = Wa[fa >>> 12];
            if ((Oa | fa) & 1) {
                nb(ga);
            } else {
                Pa[(fa ^ Oa) >> 1] = ga;
            }
        }
    }
    function pb(ga) {
        mb(ga);
        fa++;
        mb(ga >> 8);
        fa++;
        mb(ga >> 16);
        fa++;
        mb(ga >> 24);
        fa -= 3;
    }
    function qb(ga) {
        var Oa;
        {
            Oa = Wa[fa >>> 12];
            if ((Oa | fa) & 3) {
                pb(ga);
            } else {
                Qa[(fa ^ Oa) >> 2] = ga;
            }
        }
    }
    function rb() {
        var Ya;
        Za(fa, 0, 0);
        Ya = Ra[fa >>> 12] ^ fa;
        return Na[Ya];
    }
    function sb() {
        var Ya;
        return (Ya = Ra[fa >>> 12]) == -1 ? rb() : Na[fa ^ Ya];
    }
    function tb() {
        var ga;
        ga = sb();
        fa++;
        ga |= sb() << 8;
        fa--;
        return ga;
    }
    function ub() {
        var Ya;
        return ((Ya = Ra[fa >>> 12]) | fa) & 1 ? tb() : Pa[(fa ^ Ya) >> 1];
    }
    function vb() {
        var ga;
        ga = sb();
        fa++;
        ga |= sb() << 8;
        fa++;
        ga |= sb() << 16;
        fa++;
        ga |= sb() << 24;
        fa -= 3;
        return ga;
    }
    function wb() {
        var Ya;
        return ((Ya = Ra[fa >>> 12]) | fa) & 3 ? vb() : Qa[(fa ^ Ya) >> 2];
    }
    function xb(ga) {
        var Ya;
        Za(fa, 1, 0);
        Ya = Sa[fa >>> 12] ^ fa;
        Na[Ya] = ga;
    }
    function yb(ga) {
        var Ya;
        Ya = Sa[fa >>> 12];
        if (Ya == -1) {
            xb(ga);
        } else {
            Na[fa ^ Ya] = ga;
        }
    }
    function zb(ga) {
        yb(ga);
        fa++;
        yb(ga >> 8);
        fa--;
    }
    function Ab(ga) {
        var Ya;
        Ya = Sa[fa >>> 12];
        if ((Ya | fa) & 1) {
            zb(ga);
        } else {
            Pa[(fa ^ Ya) >> 1] = ga;
        }
    }
    function Bb(ga) {
        yb(ga);
        fa++;
        yb(ga >> 8);
        fa++;
        yb(ga >> 16);
        fa++;
        yb(ga >> 24);
        fa -= 3;
    }
    function Cb(ga) {
        var Ya;
        Ya = Sa[fa >>> 12];
        if ((Ya | fa) & 3) {
            Bb(ga);
        } else {
            Qa[(fa ^ Ya) >> 2] = ga;
        }
    }
    var Db, Eb, Fb, Gb;
    function Hb() {
        var ga, Ha;
        ga = Na[Eb++];
        Ha = Na[Eb++];
        return ga | Ha << 8;
    }
    function Ib(Ea, Jb) {
        var base, fa, Kb, Lb;
        switch (Ea & 7 | Ea >> 3 & 24) {
          case 4:
            Kb = Na[Eb++];
            base = Kb & 7;
            if (base == 5) {
                {
                    fa = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
            } else {
                fa = xa[base];
                if (Jb && base == 4) fa = fa + Jb & -1;
            }
            Lb = Kb >> 3 & 7;
            if (Lb != 4) {
                fa = fa + (xa[Lb] << (Kb >> 6)) & -1;
            }
            break;
          case 12:
            Kb = Na[Eb++];
            fa = Na[Eb++] << 24 >> 24;
            base = Kb & 7;
            fa = fa + xa[base] & -1;
            if (Jb && base == 4) fa = fa + Jb & -1;
            Lb = Kb >> 3 & 7;
            if (Lb != 4) {
                fa = fa + (xa[Lb] << (Kb >> 6)) & -1;
            }
            break;
          case 20:
            Kb = Na[Eb++];
            {
                fa = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                Eb += 4;
            }
            base = Kb & 7;
            fa = fa + xa[base] & -1;
            if (Jb && base == 4) fa = fa + Jb & -1;
            Lb = Kb >> 3 & 7;
            if (Lb != 4) {
                fa = fa + (xa[Lb] << (Kb >> 6)) & -1;
            }
            break;
          case 5:
            {
                fa = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                Eb += 4;
            }
            break;
          case 0:
          case 1:
          case 2:
          case 3:
          case 6:
          case 7:
            base = Ea & 7;
            fa = xa[base];
            break;
          case 8:
          case 9:
          case 10:
          case 11:
          case 13:
          case 14:
          case 15:
            fa = Na[Eb++] << 24 >> 24;
            base = Ea & 7;
            fa = fa + xa[base] & -1;
            break;
          case 16:
          case 17:
          case 18:
          case 19:
          case 21:
          case 22:
          case 23:
            {
                fa = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                Eb += 4;
            }
            base = Ea & 7;
            fa = fa + xa[base] & -1;
            break;
          default:
            throw "get_modrm";
        }
        if (Da & 15) {
            fa = fa + wa.segs[(Da & 15) - 1].base & -1;
        }
        return fa;
    }
    function Mb() {
        var fa;
        {
            fa = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
            Eb += 4;
        }
        if (Da & 15) {
            fa = fa + wa.segs[(Da & 15) - 1].base & -1;
        }
        return fa;
    }
    function Nb(Ga, ga) {
        if (Ga & 4) xa[Ga & 3] = xa[Ga & 3] & -65281 | (ga & 255) << 8; else xa[Ga & 3] = xa[Ga & 3] & -256 | ga & 255;
    }
    function Ob(Ga, ga) {
        xa[Ga] = xa[Ga] & -65536 | ga & 65535;
    }
    function Pb(Ja, Qb, Rb) {
        var Sb;
        switch (Ja) {
          case 0:
            ya = Rb;
            Qb = Qb + Rb & -1;
            za = Qb;
            Aa = 0;
            break;
          case 1:
            Qb = Qb | Rb;
            za = Qb;
            Aa = 12;
            break;
          case 2:
            Sb = Tb(2);
            ya = Rb;
            Qb = Qb + Rb + Sb & -1;
            za = Qb;
            Aa = Sb ? 3 : 0;
            break;
          case 3:
            Sb = Tb(2);
            ya = Rb;
            Qb = Qb - Rb - Sb & -1;
            za = Qb;
            Aa = Sb ? 9 : 6;
            break;
          case 4:
            Qb = Qb & Rb;
            za = Qb;
            Aa = 12;
            break;
          case 5:
            ya = Rb;
            Qb = Qb - Rb & -1;
            za = Qb;
            Aa = 6;
            break;
          case 6:
            Qb = Qb ^ Rb;
            za = Qb;
            Aa = 12;
            break;
          case 7:
            ya = Rb;
            za = Qb - Rb & -1;
            Aa = 6;
            break;
          default:
            throw "arith" + 8 + ": invalid op";
        }
        return Qb;
    }
    function Ub(ga) {
        if (Aa < 25) {
            Ba = Aa;
        }
        Ca = ga + 1 & -1;
        Aa = 25;
        return Ca;
    }
    function Vb(ga) {
        if (Aa < 25) {
            Ba = Aa;
        }
        Ca = ga - 1 & -1;
        Aa = 28;
        return Ca;
    }
    function Wb(Ja, Qb, Rb) {
        var Sb;
        switch (Ja) {
          case 0:
            ya = Rb;
            Qb = Qb + Rb & -1;
            za = Qb;
            Aa = 1;
            break;
          case 1:
            Qb = Qb | Rb;
            za = Qb;
            Aa = 13;
            break;
          case 2:
            Sb = Tb(2);
            ya = Rb;
            Qb = Qb + Rb + Sb & -1;
            za = Qb;
            Aa = Sb ? 4 : 1;
            break;
          case 3:
            Sb = Tb(2);
            ya = Rb;
            Qb = Qb - Rb - Sb & -1;
            za = Qb;
            Aa = Sb ? 10 : 7;
            break;
          case 4:
            Qb = Qb & Rb;
            za = Qb;
            Aa = 13;
            break;
          case 5:
            ya = Rb;
            Qb = Qb - Rb & -1;
            za = Qb;
            Aa = 7;
            break;
          case 6:
            Qb = Qb ^ Rb;
            za = Qb;
            Aa = 13;
            break;
          case 7:
            ya = Rb;
            za = Qb - Rb & -1;
            Aa = 7;
            break;
          default:
            throw "arith" + 16 + ": invalid op";
        }
        return Qb;
    }
    function Xb(ga) {
        if (Aa < 25) {
            Ba = Aa;
        }
        Ca = ga + 1 & -1;
        Aa = 26;
        return Ca;
    }
    function Yb(ga) {
        if (Aa < 25) {
            Ba = Aa;
        }
        Ca = ga - 1 & -1;
        Aa = 29;
        return Ca;
    }
    function Zb(Ja, Qb, Rb) {
        var Sb;
        switch (Ja) {
          case 0:
            ya = Rb;
            Qb = Qb + Rb & -1;
            za = Qb;
            Aa = 2;
            break;
          case 1:
            Qb = Qb | Rb;
            za = Qb;
            Aa = 14;
            break;
          case 2:
            Sb = Tb(2);
            ya = Rb;
            Qb = Qb + Rb + Sb & -1;
            za = Qb;
            Aa = Sb ? 5 : 2;
            break;
          case 3:
            Sb = Tb(2);
            ya = Rb;
            Qb = Qb - Rb - Sb & -1;
            za = Qb;
            Aa = Sb ? 11 : 8;
            break;
          case 4:
            Qb = Qb & Rb;
            za = Qb;
            Aa = 14;
            break;
          case 5:
            ya = Rb;
            Qb = Qb - Rb & -1;
            za = Qb;
            Aa = 8;
            break;
          case 6:
            Qb = Qb ^ Rb;
            za = Qb;
            Aa = 14;
            break;
          case 7:
            ya = Rb;
            za = Qb - Rb & -1;
            Aa = 8;
            break;
          default:
            throw "arith" + 32 + ": invalid op";
        }
        return Qb;
    }
    function ac(ga) {
        if (Aa < 25) {
            Ba = Aa;
        }
        Ca = ga + 1 & -1;
        Aa = 27;
        return Ca;
    }
    function bc(ga) {
        if (Aa < 25) {
            Ba = Aa;
        }
        Ca = ga - 1 & -1;
        Aa = 30;
        return Ca;
    }
    function cc(Ja, Qb, Rb) {
        var dc, Sb;
        switch (Ja) {
          case 0:
            if (Rb & 31) {
                Rb &= 7;
                Qb &= 255;
                dc = Qb;
                Qb = Qb << Rb | Qb >>> 8 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= Qb & 1 | (dc ^ Qb) << 4 & 2048;
                Aa = 24;
            }
            break;
          case 1:
            if (Rb & 31) {
                Rb &= 7;
                Qb &= 255;
                dc = Qb;
                Qb = Qb >>> Rb | Qb << 8 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= Qb >> 7 & 1 | (dc ^ Qb) << 4 & 2048;
                Aa = 24;
            }
            break;
          case 2:
            Rb = ca[Rb & 31];
            if (Rb) {
                Qb &= 255;
                dc = Qb;
                Sb = Tb(2);
                Qb = Qb << Rb | Sb << Rb - 1;
                if (Rb > 1) Qb |= dc >>> 9 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= (dc ^ Qb) << 4 & 2048 | dc >> 8 - Rb & 1;
                Aa = 24;
            }
            break;
          case 3:
            Rb = ca[Rb & 31];
            if (Rb) {
                Qb &= 255;
                dc = Qb;
                Sb = Tb(2);
                Qb = Qb >>> Rb | Sb << 8 - Rb;
                if (Rb > 1) Qb |= dc << 9 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= (dc ^ Qb) << 4 & 2048 | dc >> Rb - 1 & 1;
                Aa = 24;
            }
            break;
          case 4:
          case 6:
            Rb &= 31;
            if (Rb) {
                ya = Qb << Rb - 1;
                za = Qb = Qb << Rb;
                Aa = 15;
            }
            break;
          case 5:
            Rb &= 31;
            if (Rb) {
                Qb &= 255;
                ya = Qb >>> Rb - 1;
                za = Qb = Qb >>> Rb;
                Aa = 18;
            }
            break;
          case 7:
            Rb &= 31;
            if (Rb) {
                Qb = Qb << 24 >> 24;
                ya = Qb >> Rb - 1;
                za = Qb = Qb >> Rb;
                Aa = 18;
            }
            break;
          default:
            throw "unsupported shift8=" + Ja;
        }
        return Qb;
    }
    function fc(Ja, Qb, Rb) {
        var dc, Sb;
        switch (Ja) {
          case 0:
            if (Rb & 31) {
                Rb &= 15;
                Qb &= 65535;
                dc = Qb;
                Qb = Qb << Rb | Qb >>> 16 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= Qb & 1 | (dc ^ Qb) >> 4 & 2048;
                Aa = 24;
            }
            break;
          case 1:
            if (Rb & 31) {
                Rb &= 15;
                Qb &= 65535;
                dc = Qb;
                Qb = Qb >>> Rb | Qb << 16 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= Qb >> 15 & 1 | (dc ^ Qb) >> 4 & 2048;
                Aa = 24;
            }
            break;
          case 2:
            Rb = ba[Rb & 31];
            if (Rb) {
                Qb &= 65535;
                dc = Qb;
                Sb = Tb(2);
                Qb = Qb << Rb | Sb << Rb - 1;
                if (Rb > 1) Qb |= dc >>> 17 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= (dc ^ Qb) >> 4 & 2048 | dc >> 16 - Rb & 1;
                Aa = 24;
            }
            break;
          case 3:
            Rb = ba[Rb & 31];
            if (Rb) {
                Qb &= 65535;
                dc = Qb;
                Sb = Tb(2);
                Qb = Qb >>> Rb | Sb << 16 - Rb;
                if (Rb > 1) Qb |= dc << 17 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= (dc ^ Qb) >> 4 & 2048 | dc >> Rb - 1 & 1;
                Aa = 24;
            }
            break;
          case 4:
          case 6:
            Rb &= 31;
            if (Rb) {
                ya = Qb << Rb - 1;
                za = Qb = Qb << Rb;
                Aa = 16;
            }
            break;
          case 5:
            Rb &= 31;
            if (Rb) {
                Qb &= 65535;
                ya = Qb >>> Rb - 1;
                za = Qb = Qb >>> Rb;
                Aa = 19;
            }
            break;
          case 7:
            Rb &= 31;
            if (Rb) {
                Qb = Qb << 16 >> 16;
                ya = Qb >> Rb - 1;
                za = Qb = Qb >> Rb;
                Aa = 19;
            }
            break;
          default:
            throw "unsupported shift16=" + Ja;
        }
        return Qb;
    }
    function gc(Ja, Qb, Rb) {
        var dc, Sb;
        switch (Ja) {
          case 0:
            Rb &= 31;
            if (Rb) {
                dc = Qb;
                Qb = Qb << Rb | Qb >>> 32 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= Qb & 1 | (dc ^ Qb) >> 20 & 2048;
                Aa = 24;
            }
            break;
          case 1:
            Rb &= 31;
            if (Rb) {
                dc = Qb;
                Qb = Qb >>> Rb | Qb << 32 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= Qb >> 31 & 1 | (dc ^ Qb) >> 20 & 2048;
                Aa = 24;
            }
            break;
          case 2:
            Rb &= 31;
            if (Rb) {
                dc = Qb;
                Sb = Tb(2);
                Qb = Qb << Rb | Sb << Rb - 1;
                if (Rb > 1) Qb |= dc >>> 33 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= (dc ^ Qb) >> 20 & 2048 | dc >> 32 - Rb & 1;
                Aa = 24;
            }
            break;
          case 3:
            Rb &= 31;
            if (Rb) {
                dc = Qb;
                Sb = Tb(2);
                Qb = Qb >>> Rb | Sb << 32 - Rb;
                if (Rb > 1) Qb |= dc << 33 - Rb;
                ya = ec() & ~(2048 | 1);
                ya |= (dc ^ Qb) >> 20 & 2048 | dc >> Rb - 1 & 1;
                Aa = 24;
            }
            break;
          case 4:
          case 6:
            Rb &= 31;
            if (Rb) {
                ya = Qb << Rb - 1;
                za = Qb = Qb << Rb;
                Aa = 17;
            }
            break;
          case 5:
            Rb &= 31;
            if (Rb) {
                ya = Qb >>> Rb - 1;
                za = Qb = Qb >>> Rb;
                Aa = 20;
            }
            break;
          case 7:
            Rb &= 31;
            if (Rb) {
                ya = Qb >> Rb - 1;
                za = Qb = Qb >> Rb;
                Aa = 20;
            }
            break;
          default:
            throw "unsupported shift32=" + Ja;
        }
        return Qb;
    }
    function hc(Qb, Rb, ic) {
        ic &= 31;
        if (ic) {
            ya = Qb << ic - 1;
            za = Qb = Qb << ic | Rb >>> 32 - ic;
            Aa = 17;
        }
        return Qb;
    }
    function jc(Qb, Rb, ic) {
        ic &= 31;
        if (ic) {
            ya = Qb >> ic - 1;
            za = Qb = Qb >>> ic | Rb << 32 - ic;
            Aa = 20;
        }
        return Qb;
    }
    function kc(Qb, Rb) {
        Rb &= 31;
        ya = Qb >> Rb;
        Aa = 20;
    }
    function lc(Qb, Rb) {
        Rb &= 31;
        ya = Qb >> Rb;
        Qb |= 1 << Rb;
        Aa = 20;
        return Qb;
    }
    function mc(Qb, Rb) {
        Rb &= 31;
        ya = Qb >> Rb;
        Qb &= ~(1 << Rb);
        Aa = 20;
        return Qb;
    }
    function nc(Qb, Rb) {
        Rb &= 31;
        ya = Qb >> Rb;
        Qb ^= 1 << Rb;
        Aa = 20;
        return Qb;
    }
    function oc(Qb, Rb) {
        if (Rb) {
            Qb = 0;
            while ((Rb & 1) == 0) {
                Qb++;
                Rb >>= 1;
            }
            za = 1;
        } else {
            za = 0;
        }
        Aa = 14;
        return Qb;
    }
    function pc(Qb, Rb) {
        if (Rb) {
            Qb = 31;
            while (Rb >= 0) {
                Qb--;
                Rb <<= 1;
            }
            za = 1;
        } else {
            za = 0;
        }
        Aa = 14;
        return Qb;
    }
    function qc(b) {
        var a, q, r;
        a = xa[0] & 65535;
        b &= 255;
        if (a >> 8 >= b) rc(0);
        q = a / b & -1;
        r = a % b;
        Ob(0, q & 255 | r << 8);
    }
    function sc(b) {
        var a, q, r;
        a = xa[0] << 16 >> 16;
        b = b << 24 >> 24;
        if (b == 0) rc(0);
        q = a / b & -1;
        if (q << 24 >> 24 != q) rc(0);
        r = a % b;
        Ob(0, q & 255 | r << 8);
    }
    function tc(b) {
        var a, q, r;
        a = xa[2] << 16 | xa[0] & 65535;
        b &= 65535;
        if (a >>> 16 >= b) rc(0);
        q = a / b & -1;
        r = a % b;
        Ob(0, q);
        Ob(2, r);
    }
    function uc(b) {
        var a, q, r;
        a = xa[2] << 16 | xa[0] & 65535;
        b = b << 16 >> 16;
        if (b == 0) rc(0);
        q = a / b & -1;
        if (q << 16 >> 16 != q) rc(0);
        r = a % b;
        Ob(0, q);
        Ob(2, r);
    }
    function vc(wc, xc, b) {
        var a, i, yc;
        wc = wc >>> 0;
        xc = xc >>> 0;
        b = b >>> 0;
        if (wc >= b) {
            rc(0);
        }
        if (wc >= 0 && wc <= 2097152) {
            a = wc * 4294967296 + xc;
            Ma = a % b & -1;
            return a / b & -1;
        } else {
            for (i = 0; i < 32; i++) {
                yc = wc >> 31;
                wc = (wc << 1 | xc >>> 31) >>> 0;
                if (yc || wc >= b) {
                    wc = wc - b;
                    xc = xc << 1 | 1;
                } else {
                    xc = xc << 1;
                }
            }
            Ma = wc & -1;
            return xc;
        }
    }
    function zc(wc, xc, b) {
        var Ac, Bc, q;
        if (wc < 0) {
            Ac = 1;
            wc = ~wc;
            xc = -xc & -1;
            if (xc == 0) wc = wc + 1 & -1;
        } else {
            Ac = 0;
        }
        if (b < 0) {
            b = -b & -1;
            Bc = 1;
        } else {
            Bc = 0;
        }
        q = vc(wc, xc, b);
        Bc ^= Ac;
        if (Bc) {
            if (q >>> 0 > 2147483648) rc(0);
            q = -q & -1;
        } else {
            if (q >>> 0 >= 2147483648) rc(0);
        }
        if (Ac) {
            Ma = -Ma & -1;
        }
        return q;
    }
    function Cc(a, b) {
        a &= 255;
        b &= 255;
        za = (xa[0] & 255) * (b & 255);
        ya = za >> 8;
        Aa = 21;
        return za;
    }
    function Dc(a, b) {
        a = a << 24 >> 24;
        b = b << 24 >> 24;
        za = a * b & -1;
        ya = (za != za << 24 >> 24) >> 0;
        Aa = 21;
        return za;
    }
    function Ec(a, b) {
        za = (a & 65535) * (b & 65535) & -1;
        ya = za >>> 16;
        Aa = 22;
        return za;
    }
    function Fc(a, b) {
        a = a << 16 >> 16;
        b = b << 16 >> 16;
        za = a * b & -1;
        ya = (za != za << 16 >> 16) >> 0;
        Aa = 22;
        return za;
    }
    function Gc(a, b) {
        var r, xc, wc, Hc, Ic, m;
        a = a >>> 0;
        b = b >>> 0;
        r = a * b;
        if (r <= 4294967295) {
            Ma = 0;
            r &= -1;
        } else {
            xc = a & 65535;
            wc = a >>> 16;
            Hc = b & 65535;
            Ic = b >>> 16;
            r = xc * Hc;
            Ma = wc * Ic;
            m = xc * Ic;
            r += (m & 65535) << 16 >>> 0;
            Ma += m >>> 16;
            if (r >= 4294967296) {
                r -= 4294967296;
                Ma++;
            }
            m = wc * Hc;
            r += (m & 65535) << 16 >>> 0;
            Ma += m >>> 16;
            if (r >= 4294967296) {
                r -= 4294967296;
                Ma++;
            }
            r &= -1;
            Ma &= -1;
        }
        return r;
    }
    function Jc(a, b) {
        za = Gc(a, b);
        ya = Ma;
        Aa = 23;
        return za;
    }
    function Kc(a, b) {
        var s, r;
        s = 0;
        if (a < 0) {
            a = -a;
            s = 1;
        }
        if (b < 0) {
            b = -b;
            s ^= 1;
        }
        r = Gc(a, b);
        if (s) {
            Ma = ~Ma;
            r = -r & -1;
            if (r == 0) {
                Ma = Ma + 1 & -1;
            }
        }
        za = r;
        ya = Ma - (r >> 31) & -1;
        Aa = 23;
        return r;
    }
    function Lc(Aa) {
        var Qb, Mc;
        switch (Aa) {
          case 0:
            Mc = (za & 255) < (ya & 255);
            break;
          case 1:
            Mc = (za & 65535) < (ya & 65535);
            break;
          case 2:
            Mc = za >>> 0 < ya >>> 0;
            break;
          case 3:
            Mc = (za & 255) <= (ya & 255);
            break;
          case 4:
            Mc = (za & 65535) <= (ya & 65535);
            break;
          case 5:
            Mc = za >>> 0 <= ya >>> 0;
            break;
          case 6:
            Mc = (za + ya & 255) < (ya & 255);
            break;
          case 7:
            Mc = (za + ya & 65535) < (ya & 65535);
            break;
          case 8:
            Mc = za + ya >>> 0 < ya >>> 0;
            break;
          case 9:
            Qb = za + ya + 1 & 255;
            Mc = Qb <= (ya & 255);
            break;
          case 10:
            Qb = za + ya + 1 & 65535;
            Mc = Qb <= (ya & 65535);
            break;
          case 11:
            Qb = za + ya + 1 >>> 0;
            Mc = Qb <= ya >>> 0;
            break;
          case 12:
          case 13:
          case 14:
            Mc = 0;
            break;
          case 15:
            Mc = ya >> 7 & 1;
            break;
          case 16:
            Mc = ya >> 15 & 1;
            break;
          case 17:
            Mc = ya >> 31 & 1;
            break;
          case 18:
          case 19:
          case 20:
            Mc = ya & 1;
            break;
          case 21:
          case 22:
          case 23:
            Mc = ya != 0;
            break;
          case 24:
            Mc = ya & 1;
            break;
          default:
            throw "GET_CARRY: unsupported cc_op=" + Aa;
        }
        return Mc;
    }
    function Tb(Nc) {
        var Mc, Qb;
        switch (Nc >> 1) {
          case 0:
            switch (Aa) {
              case 0:
                Qb = za - ya & -1;
                Mc = ((Qb ^ ya ^ -1) & (Qb ^ za)) >> 7 & 1;
                break;
              case 1:
                Qb = za - ya & -1;
                Mc = ((Qb ^ ya ^ -1) & (Qb ^ za)) >> 15 & 1;
                break;
              case 2:
                Qb = za - ya & -1;
                Mc = ((Qb ^ ya ^ -1) & (Qb ^ za)) >> 31 & 1;
                break;
              case 3:
                Qb = za - ya - 1 & -1;
                Mc = ((Qb ^ ya ^ -1) & (Qb ^ za)) >> 7 & 1;
                break;
              case 4:
                Qb = za - ya - 1 & -1;
                Mc = ((Qb ^ ya ^ -1) & (Qb ^ za)) >> 15 & 1;
                break;
              case 5:
                Qb = za - ya - 1 & -1;
                Mc = ((Qb ^ ya ^ -1) & (Qb ^ za)) >> 31 & 1;
                break;
              case 6:
                Qb = za + ya & -1;
                Mc = ((Qb ^ ya) & (Qb ^ za)) >> 7 & 1;
                break;
              case 7:
                Qb = za + ya & -1;
                Mc = ((Qb ^ ya) & (Qb ^ za)) >> 15 & 1;
                break;
              case 8:
                Qb = za + ya & -1;
                Mc = ((Qb ^ ya) & (Qb ^ za)) >> 31 & 1;
                break;
              case 9:
                Qb = za + ya + 1 & -1;
                Mc = ((Qb ^ ya) & (Qb ^ za)) >> 7 & 1;
                break;
              case 10:
                Qb = za + ya + 1 & -1;
                Mc = ((Qb ^ ya) & (Qb ^ za)) >> 15 & 1;
                break;
              case 11:
                Qb = za + ya + 1 & -1;
                Mc = ((Qb ^ ya) & (Qb ^ za)) >> 31 & 1;
                break;
              case 12:
              case 13:
              case 14:
                Mc = 0;
                break;
              case 15:
              case 18:
                Mc = (ya ^ za) >> 7 & 1;
                break;
              case 16:
              case 19:
                Mc = (ya ^ za) >> 15 & 1;
                break;
              case 17:
              case 20:
                Mc = (ya ^ za) >> 31 & 1;
                break;
              case 21:
              case 22:
              case 23:
                Mc = ya != 0;
                break;
              case 24:
                Mc = ya >> 11 & 1;
                break;
              case 25:
                Mc = (Ca & 255) == 128;
                break;
              case 26:
                Mc = (Ca & 65535) == 32768;
                break;
              case 27:
                Mc = Ca == -2147483648;
                break;
              case 28:
                Mc = (Ca & 255) == 127;
                break;
              case 29:
                Mc = (Ca & 65535) == 32767;
                break;
              case 30:
                Mc = Ca == 2147483647;
                break;
              default:
                throw "JO: unsupported cc_op=" + Aa;
            }
            break;
          case 1:
            if (Aa >= 25) {
                Mc = Lc(Ba);
            } else {
                Mc = Lc(Aa);
            }
            break;
          case 2:
            switch (Aa) {
              case 0:
              case 3:
              case 6:
              case 9:
              case 12:
              case 15:
              case 18:
              case 21:
                Mc = (za & 255) == 0;
                break;
              case 1:
              case 4:
              case 7:
              case 10:
              case 13:
              case 16:
              case 19:
              case 22:
                Mc = (za & 65535) == 0;
                break;
              case 2:
              case 5:
              case 8:
              case 11:
              case 14:
              case 17:
              case 20:
              case 23:
                Mc = za == 0;
                break;
              case 24:
                Mc = ya >> 6 & 1;
                break;
              case 25:
              case 28:
                Mc = (Ca & 255) == 0;
                break;
              case 26:
              case 29:
                Mc = (Ca & 65535) == 0;
                break;
              case 27:
              case 30:
                Mc = Ca == 0;
                break;
              default:
                throw "JZ: unsupported cc_op=" + Aa;
            }
            break;
          case 3:
            switch (Aa) {
              case 6:
                Mc = (za + ya & 255) <= (ya & 255);
                break;
              case 7:
                Mc = (za + ya & 65535) <= (ya & 65535);
                break;
              case 8:
                Mc = za + ya >>> 0 <= ya >>> 0;
                break;
              case 24:
                Mc = (ya & (64 | 1)) != 0;
                break;
              default:
                Mc = Tb(2) | Tb(4);
                break;
            }
            break;
          case 4:
            switch (Aa) {
              case 0:
              case 3:
              case 6:
              case 9:
              case 12:
              case 15:
              case 18:
              case 21:
                Mc = za >> 7 & 1;
                break;
              case 1:
              case 4:
              case 7:
              case 10:
              case 13:
              case 16:
              case 19:
              case 22:
                Mc = za >> 15 & 1;
                break;
              case 2:
              case 5:
              case 8:
              case 11:
              case 14:
              case 17:
              case 20:
              case 23:
                Mc = za < 0;
                break;
              case 24:
                Mc = ya >> 7 & 1;
                break;
              case 25:
              case 28:
                Mc = Ca >> 7 & 1;
                break;
              case 26:
              case 29:
                Mc = Ca >> 15 & 1;
                break;
              case 27:
              case 30:
                Mc = Ca < 0;
                break;
              default:
                throw "JS: unsupported cc_op=" + Aa;
            }
            break;
          case 5:
            switch (Aa) {
              case 0:
              case 3:
              case 6:
              case 9:
              case 12:
              case 15:
              case 18:
              case 21:
              case 1:
              case 4:
              case 7:
              case 10:
              case 13:
              case 16:
              case 19:
              case 22:
              case 2:
              case 5:
              case 8:
              case 11:
              case 14:
              case 17:
              case 20:
              case 23:
                Mc = aa[za & 255];
                break;
              case 24:
                Mc = ya >> 2 & 1;
                break;
              case 25:
              case 28:
              case 26:
              case 29:
              case 27:
              case 30:
                Mc = aa[Ca & 255];
                break;
              default:
                throw "JP: unsupported cc_op=" + Aa;
            }
            break;
          case 6:
            switch (Aa) {
              case 6:
                Mc = za + ya << 24 < ya << 24;
                break;
              case 7:
                Mc = za + ya << 16 < ya << 16;
                break;
              case 8:
                Mc = (za + ya & -1) < ya;
                break;
              case 12:
                Mc = za << 24 < 0;
                break;
              case 13:
                Mc = za << 16 < 0;
                break;
              case 14:
                Mc = za < 0;
                break;
              case 24:
                Mc = (ya >> 7 ^ ya >> 11) & 1;
                break;
              case 25:
              case 28:
                Mc = Ca << 24 < 0;
                break;
              case 26:
              case 29:
                Mc = Ca << 16 < 0;
                break;
              case 27:
              case 30:
                Mc = Ca < 0;
                break;
              default:
                Mc = Tb(8) ^ Tb(0);
                break;
            }
            break;
          case 7:
            switch (Aa) {
              case 6:
                Mc = za + ya << 24 <= ya << 24;
                break;
              case 7:
                Mc = za + ya << 16 <= ya << 16;
                break;
              case 8:
                Mc = (za + ya & -1) <= ya;
                break;
              case 12:
                Mc = za << 24 <= 0;
                break;
              case 13:
                Mc = za << 16 <= 0;
                break;
              case 14:
                Mc = za <= 0;
                break;
              case 24:
                Mc = (ya >> 7 ^ ya >> 11 | ya >> 6) & 1;
                break;
              case 25:
              case 28:
                Mc = Ca << 24 <= 0;
                break;
              case 26:
              case 29:
                Mc = Ca << 16 <= 0;
                break;
              case 27:
              case 30:
                Mc = Ca <= 0;
                break;
              default:
                Mc = Tb(8) ^ Tb(0) | Tb(4);
                break;
            }
            break;
          default:
            throw "unsupported cond: " + Nc;
        }
        return Mc ^ Nc & 1;
    }
    function Oc() {
        var Qb, Mc;
        switch (Aa) {
          case 0:
          case 1:
          case 2:
            Qb = za - ya & -1;
            Mc = (za ^ Qb ^ ya) & 16;
            break;
          case 3:
          case 4:
          case 5:
            Qb = za - ya - 1 & -1;
            Mc = (za ^ Qb ^ ya) & 16;
            break;
          case 6:
          case 7:
          case 8:
            Qb = za + ya & -1;
            Mc = (za ^ Qb ^ ya) & 16;
            break;
          case 9:
          case 10:
          case 11:
            Qb = za + ya + 1 & -1;
            Mc = (za ^ Qb ^ ya) & 16;
            break;
          case 12:
          case 13:
          case 14:
            Mc = 0;
            break;
          case 15:
          case 18:
          case 16:
          case 19:
          case 17:
          case 20:
          case 21:
          case 22:
          case 23:
            Mc = 0;
            break;
          case 24:
            Mc = ya & 16;
            break;
          case 25:
          case 26:
          case 27:
            Mc = (Ca ^ Ca - 1) & 16;
            break;
          case 28:
          case 29:
          case 30:
            Mc = (Ca ^ Ca + 1) & 16;
            break;
          default:
            throw "AF: unsupported cc_op=" + Aa;
        }
        return Mc;
    }
    function ec() {
        return Tb(2) << 0 | Tb(10) << 2 | Tb(4) << 6 | Tb(8) << 7 | Tb(0) << 11 | Oc();
    }
    function Pc() {
        var Qc;
        Qc = ec();
        Qc |= wa.df & 1024;
        Qc |= wa.eflags;
        return Qc;
    }
    function Rc(Qc, Sc) {
        Aa = 24;
        ya = Qc & (2048 | 128 | 64 | 16 | 4 | 1);
        wa.df = 1 - 2 * (Qc >> 10 & 1);
        wa.eflags = wa.eflags & ~Sc | Qc & Sc;
    }
    function Tc() {
        return wa.cycle_count + (ua - Ka);
    }
    function Uc(na) {
        throw "CPU abort: " + na;
    }
    function Vc() {
        wa.eip = Db;
        wa.cc_src = ya;
        wa.cc_dst = za;
        wa.cc_op = Aa;
        wa.cc_op2 = Ba;
        wa.cc_dst2 = Ca;
        wa.dump();
    }
    function Wc(intno, error_code) {
        wa.cycle_count += ua - Ka;
        wa.eip = Db;
        wa.cc_src = ya;
        wa.cc_dst = za;
        wa.cc_op = Aa;
        wa.cc_op2 = Ba;
        wa.cc_dst2 = Ca;
        throw {
            intno: intno,
            error_code: error_code
        };
    }
    function rc(intno) {
        Wc(intno, 0);
    }
    function Xc(Yc) {
        wa.cpl = Yc;
        if (wa.cpl == 3) {
            Va = Ta;
            Wa = Ua;
        } else {
            Va = Ra;
            Wa = Sa;
        }
    }
    function Zc(fa, ad) {
        var Ya;
        if (ad) {
            Ya = Wa[fa >>> 12];
        } else {
            Ya = Va[fa >>> 12];
        }
        if (Ya == -1) {
            Za(fa, ad, wa.cpl == 3);
            if (ad) {
                Ya = Wa[fa >>> 12];
            } else {
                Ya = Va[fa >>> 12];
            }
        }
        return Ya ^ fa;
    }
    function bd() {
        var cd, l, dd, ed, i, fd;
        cd = xa[1] >>> 0;
        l = 4096 - (xa[6] & 4095) >> 2;
        if (cd > l) cd = l;
        l = 4096 - (xa[7] & 4095) >> 2;
        if (cd > l) cd = l;
        if (cd) {
            dd = Zc(xa[6], 0);
            ed = Zc(xa[7], 1);
            fd = cd << 2;
            ed >>= 2;
            dd >>= 2;
            for (i = 0; i < cd; i++) Qa[ed + i] = Qa[dd + i];
            xa[6] = xa[6] + fd & -1;
            xa[7] = xa[7] + fd & -1;
            xa[1] = xa[1] - cd & -1;
            return true;
        }
        return false;
    }
    function gd() {
        var cd, l, ed, i, fd, ga;
        cd = xa[1] >>> 0;
        l = 4096 - (xa[7] & 4095) >> 2;
        if (cd > l) cd = l;
        if (cd) {
            ed = Zc(xa[7], 1);
            ga = xa[0];
            ed >>= 2;
            for (i = 0; i < cd; i++) Qa[ed + i] = ga;
            fd = cd << 2;
            xa[7] = xa[7] + fd & -1;
            xa[1] = xa[1] - cd & -1;
            return true;
        }
        return false;
    }
    function hd(Db, b) {
        var n, Da, l, Ea, id, base, Ja;
        n = 1;
        Da = 0;
        jd : for (;;) {
            switch (b) {
              case 102:
                Da |= 256;
              case 240:
              case 242:
              case 243:
              case 100:
              case 101:
                {
                    if (n + 1 > 15) rc(6);
                    fa = Db + n++ >> 0;
                    b = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                }
                break;
              case 145:
              case 146:
              case 147:
              case 148:
              case 149:
              case 150:
              case 151:
              case 64:
              case 65:
              case 66:
              case 67:
              case 68:
              case 69:
              case 70:
              case 71:
              case 72:
              case 73:
              case 74:
              case 75:
              case 76:
              case 77:
              case 78:
              case 79:
              case 80:
              case 81:
              case 82:
              case 83:
              case 84:
              case 85:
              case 86:
              case 87:
              case 88:
              case 89:
              case 90:
              case 91:
              case 92:
              case 93:
              case 94:
              case 95:
              case 152:
              case 153:
              case 201:
              case 156:
              case 157:
              case 6:
              case 14:
              case 22:
              case 30:
              case 7:
              case 23:
              case 31:
              case 195:
              case 144:
              case 204:
              case 206:
              case 207:
              case 245:
              case 248:
              case 249:
              case 252:
              case 253:
              case 250:
              case 251:
              case 158:
              case 159:
              case 244:
              case 164:
              case 165:
              case 170:
              case 171:
              case 166:
              case 167:
              case 172:
              case 173:
              case 174:
              case 175:
              case 155:
              case 236:
              case 237:
              case 238:
              case 239:
              case 215:
              case 39:
              case 47:
              case 55:
              case 63:
              case 96:
              case 97:
                break jd;
              case 176:
              case 177:
              case 178:
              case 179:
              case 180:
              case 181:
              case 182:
              case 183:
              case 4:
              case 12:
              case 20:
              case 28:
              case 36:
              case 44:
              case 52:
              case 60:
              case 168:
              case 106:
              case 235:
              case 112:
              case 113:
              case 114:
              case 115:
              case 118:
              case 119:
              case 120:
              case 121:
              case 122:
              case 123:
              case 124:
              case 125:
              case 126:
              case 127:
              case 116:
              case 117:
              case 226:
              case 227:
              case 205:
              case 228:
              case 229:
              case 230:
              case 231:
              case 212:
              case 213:
                n++;
                if (n > 15) rc(6);
                break jd;
              case 184:
              case 185:
              case 186:
              case 187:
              case 188:
              case 189:
              case 190:
              case 191:
              case 5:
              case 13:
              case 21:
              case 29:
              case 37:
              case 45:
              case 53:
              case 61:
              case 169:
              case 104:
              case 233:
              case 232:
                if (Da & 256) l = 2; else l = 4;
                n += l;
                if (n > 15) rc(6);
                break jd;
              case 136:
              case 137:
              case 138:
              case 139:
              case 134:
              case 135:
              case 142:
              case 140:
              case 196:
              case 197:
              case 0:
              case 8:
              case 16:
              case 24:
              case 32:
              case 40:
              case 48:
              case 56:
              case 1:
              case 9:
              case 17:
              case 25:
              case 33:
              case 41:
              case 49:
              case 57:
              case 2:
              case 10:
              case 18:
              case 26:
              case 34:
              case 42:
              case 50:
              case 58:
              case 3:
              case 11:
              case 19:
              case 27:
              case 35:
              case 43:
              case 51:
              case 59:
              case 132:
              case 133:
              case 208:
              case 209:
              case 210:
              case 211:
              case 143:
              case 141:
              case 254:
              case 255:
              case 216:
              case 217:
              case 218:
              case 219:
              case 220:
              case 221:
              case 222:
              case 223:
              case 98:
                {
                    {
                        if (n + 1 > 15) rc(6);
                        fa = Db + n++ >> 0;
                        Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                    }
                    switch (Ea & 7 | Ea >> 3 & 24) {
                      case 4:
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        if ((id & 7) == 5) {
                            n += 4;
                            if (n > 15) rc(6);
                        }
                        break;
                      case 12:
                        n += 2;
                        if (n > 15) rc(6);
                        break;
                      case 20:
                        n += 5;
                        if (n > 15) rc(6);
                        break;
                      case 5:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                      case 0:
                      case 1:
                      case 2:
                      case 3:
                      case 6:
                      case 7:
                        break;
                      case 8:
                      case 9:
                      case 10:
                      case 11:
                      case 13:
                      case 14:
                      case 15:
                        n++;
                        if (n > 15) rc(6);
                        break;
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 21:
                      case 22:
                      case 23:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                    }
                }
                break jd;
              case 160:
              case 161:
              case 162:
              case 163:
                n += 4;
                if (n > 15) rc(6);
                break jd;
              case 198:
              case 128:
              case 131:
              case 107:
              case 192:
              case 193:
                {
                    {
                        if (n + 1 > 15) rc(6);
                        fa = Db + n++ >> 0;
                        Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                    }
                    switch (Ea & 7 | Ea >> 3 & 24) {
                      case 4:
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        if ((id & 7) == 5) {
                            n += 4;
                            if (n > 15) rc(6);
                        }
                        break;
                      case 12:
                        n += 2;
                        if (n > 15) rc(6);
                        break;
                      case 20:
                        n += 5;
                        if (n > 15) rc(6);
                        break;
                      case 5:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                      case 0:
                      case 1:
                      case 2:
                      case 3:
                      case 6:
                      case 7:
                        break;
                      case 8:
                      case 9:
                      case 10:
                      case 11:
                      case 13:
                      case 14:
                      case 15:
                        n++;
                        if (n > 15) rc(6);
                        break;
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 21:
                      case 22:
                      case 23:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                    }
                }
                n++;
                if (n > 15) rc(6);
                break jd;
              case 199:
              case 129:
              case 105:
                {
                    {
                        if (n + 1 > 15) rc(6);
                        fa = Db + n++ >> 0;
                        Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                    }
                    switch (Ea & 7 | Ea >> 3 & 24) {
                      case 4:
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        if ((id & 7) == 5) {
                            n += 4;
                            if (n > 15) rc(6);
                        }
                        break;
                      case 12:
                        n += 2;
                        if (n > 15) rc(6);
                        break;
                      case 20:
                        n += 5;
                        if (n > 15) rc(6);
                        break;
                      case 5:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                      case 0:
                      case 1:
                      case 2:
                      case 3:
                      case 6:
                      case 7:
                        break;
                      case 8:
                      case 9:
                      case 10:
                      case 11:
                      case 13:
                      case 14:
                      case 15:
                        n++;
                        if (n > 15) rc(6);
                        break;
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 21:
                      case 22:
                      case 23:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                    }
                }
                if (Da & 256) l = 2; else l = 4;
                n += l;
                if (n > 15) rc(6);
                break jd;
              case 246:
                {
                    {
                        if (n + 1 > 15) rc(6);
                        fa = Db + n++ >> 0;
                        Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                    }
                    switch (Ea & 7 | Ea >> 3 & 24) {
                      case 4:
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        if ((id & 7) == 5) {
                            n += 4;
                            if (n > 15) rc(6);
                        }
                        break;
                      case 12:
                        n += 2;
                        if (n > 15) rc(6);
                        break;
                      case 20:
                        n += 5;
                        if (n > 15) rc(6);
                        break;
                      case 5:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                      case 0:
                      case 1:
                      case 2:
                      case 3:
                      case 6:
                      case 7:
                        break;
                      case 8:
                      case 9:
                      case 10:
                      case 11:
                      case 13:
                      case 14:
                      case 15:
                        n++;
                        if (n > 15) rc(6);
                        break;
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 21:
                      case 22:
                      case 23:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                    }
                }
                Ja = Ea >> 3 & 7;
                if (Ja == 0) {
                    n++;
                    if (n > 15) rc(6);
                }
                break jd;
              case 247:
                {
                    {
                        if (n + 1 > 15) rc(6);
                        fa = Db + n++ >> 0;
                        Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                    }
                    switch (Ea & 7 | Ea >> 3 & 24) {
                      case 4:
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        if ((id & 7) == 5) {
                            n += 4;
                            if (n > 15) rc(6);
                        }
                        break;
                      case 12:
                        n += 2;
                        if (n > 15) rc(6);
                        break;
                      case 20:
                        n += 5;
                        if (n > 15) rc(6);
                        break;
                      case 5:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                      case 0:
                      case 1:
                      case 2:
                      case 3:
                      case 6:
                      case 7:
                        break;
                      case 8:
                      case 9:
                      case 10:
                      case 11:
                      case 13:
                      case 14:
                      case 15:
                        n++;
                        if (n > 15) rc(6);
                        break;
                      case 16:
                      case 17:
                      case 18:
                      case 19:
                      case 21:
                      case 22:
                      case 23:
                        n += 4;
                        if (n > 15) rc(6);
                        break;
                    }
                }
                Ja = Ea >> 3 & 7;
                if (Ja == 0) {
                    if (Da & 256) l = 2; else l = 4;
                    n += l;
                    if (n > 15) rc(6);
                }
                break jd;
              case 234:
                n += 6;
                if (n > 15) rc(6);
                break jd;
              case 194:
                n += 2;
                if (n > 15) rc(6);
                break jd;
              case 38:
              case 46:
              case 54:
              case 62:
              case 99:
              case 103:
              case 108:
              case 109:
              case 110:
              case 111:
              case 130:
              case 154:
              case 200:
              case 202:
              case 203:
              case 214:
              case 224:
              case 225:
              case 241:
              default:
                rc(6);
              case 15:
                {
                    if (n + 1 > 15) rc(6);
                    fa = Db + n++ >> 0;
                    b = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                }
                switch (b) {
                  case 6:
                  case 162:
                  case 49:
                  case 160:
                  case 168:
                  case 161:
                  case 169:
                  case 200:
                  case 201:
                  case 202:
                  case 203:
                  case 204:
                  case 205:
                  case 206:
                  case 207:
                    break jd;
                  case 128:
                  case 129:
                  case 130:
                  case 131:
                  case 132:
                  case 133:
                  case 134:
                  case 135:
                  case 136:
                  case 137:
                  case 138:
                  case 139:
                  case 140:
                  case 141:
                  case 142:
                  case 143:
                    n += 4;
                    if (n > 15) rc(6);
                    break jd;
                  case 144:
                  case 145:
                  case 146:
                  case 147:
                  case 148:
                  case 149:
                  case 150:
                  case 151:
                  case 152:
                  case 153:
                  case 154:
                  case 155:
                  case 156:
                  case 157:
                  case 158:
                  case 159:
                  case 64:
                  case 65:
                  case 66:
                  case 67:
                  case 68:
                  case 69:
                  case 70:
                  case 71:
                  case 72:
                  case 73:
                  case 74:
                  case 75:
                  case 76:
                  case 77:
                  case 78:
                  case 79:
                  case 182:
                  case 183:
                  case 190:
                  case 191:
                  case 0:
                  case 1:
                  case 32:
                  case 34:
                  case 35:
                  case 178:
                  case 180:
                  case 181:
                  case 165:
                  case 173:
                  case 163:
                  case 171:
                  case 179:
                  case 187:
                  case 188:
                  case 189:
                  case 175:
                  case 192:
                  case 193:
                  case 177:
                    {
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        switch (Ea & 7 | Ea >> 3 & 24) {
                          case 4:
                            {
                                if (n + 1 > 15) rc(6);
                                fa = Db + n++ >> 0;
                                id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                            }
                            if ((id & 7) == 5) {
                                n += 4;
                                if (n > 15) rc(6);
                            }
                            break;
                          case 12:
                            n += 2;
                            if (n > 15) rc(6);
                            break;
                          case 20:
                            n += 5;
                            if (n > 15) rc(6);
                            break;
                          case 5:
                            n += 4;
                            if (n > 15) rc(6);
                            break;
                          case 0:
                          case 1:
                          case 2:
                          case 3:
                          case 6:
                          case 7:
                            break;
                          case 8:
                          case 9:
                          case 10:
                          case 11:
                          case 13:
                          case 14:
                          case 15:
                            n++;
                            if (n > 15) rc(6);
                            break;
                          case 16:
                          case 17:
                          case 18:
                          case 19:
                          case 21:
                          case 22:
                          case 23:
                            n += 4;
                            if (n > 15) rc(6);
                            break;
                        }
                    }
                    break jd;
                  case 164:
                  case 172:
                  case 186:
                    {
                        {
                            if (n + 1 > 15) rc(6);
                            fa = Db + n++ >> 0;
                            Ea = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                        }
                        switch (Ea & 7 | Ea >> 3 & 24) {
                          case 4:
                            {
                                if (n + 1 > 15) rc(6);
                                fa = Db + n++ >> 0;
                                id = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                            }
                            if ((id & 7) == 5) {
                                n += 4;
                                if (n > 15) rc(6);
                            }
                            break;
                          case 12:
                            n += 2;
                            if (n > 15) rc(6);
                            break;
                          case 20:
                            n += 5;
                            if (n > 15) rc(6);
                            break;
                          case 5:
                            n += 4;
                            if (n > 15) rc(6);
                            break;
                          case 0:
                          case 1:
                          case 2:
                          case 3:
                          case 6:
                          case 7:
                            break;
                          case 8:
                          case 9:
                          case 10:
                          case 11:
                          case 13:
                          case 14:
                          case 15:
                            n++;
                            if (n > 15) rc(6);
                            break;
                          case 16:
                          case 17:
                          case 18:
                          case 19:
                          case 21:
                          case 22:
                          case 23:
                            n += 4;
                            if (n > 15) rc(6);
                            break;
                        }
                    }
                    n++;
                    if (n > 15) rc(6);
                    break jd;
                  case 2:
                  case 3:
                  case 4:
                  case 5:
                  case 7:
                  case 8:
                  case 9:
                  case 10:
                  case 11:
                  case 12:
                  case 13:
                  case 14:
                  case 15:
                  case 16:
                  case 17:
                  case 18:
                  case 19:
                  case 20:
                  case 21:
                  case 22:
                  case 23:
                  case 24:
                  case 25:
                  case 26:
                  case 27:
                  case 28:
                  case 29:
                  case 30:
                  case 31:
                  case 33:
                  case 36:
                  case 37:
                  case 38:
                  case 39:
                  case 40:
                  case 41:
                  case 42:
                  case 43:
                  case 44:
                  case 45:
                  case 46:
                  case 47:
                  case 48:
                  case 50:
                  case 51:
                  case 52:
                  case 53:
                  case 54:
                  case 55:
                  case 56:
                  case 57:
                  case 58:
                  case 59:
                  case 60:
                  case 61:
                  case 62:
                  case 63:
                  case 80:
                  case 81:
                  case 82:
                  case 83:
                  case 84:
                  case 85:
                  case 86:
                  case 87:
                  case 88:
                  case 89:
                  case 90:
                  case 91:
                  case 92:
                  case 93:
                  case 94:
                  case 95:
                  case 96:
                  case 97:
                  case 98:
                  case 99:
                  case 100:
                  case 101:
                  case 102:
                  case 103:
                  case 104:
                  case 105:
                  case 106:
                  case 107:
                  case 108:
                  case 109:
                  case 110:
                  case 111:
                  case 112:
                  case 113:
                  case 114:
                  case 115:
                  case 116:
                  case 117:
                  case 118:
                  case 119:
                  case 120:
                  case 121:
                  case 122:
                  case 123:
                  case 124:
                  case 125:
                  case 126:
                  case 127:
                  case 166:
                  case 167:
                  case 170:
                  case 174:
                  case 176:
                  case 184:
                  case 185:
                  case 194:
                  case 195:
                  case 196:
                  case 197:
                  case 198:
                  case 199:
                  default:
                    rc(6);
                }
                break;
            }
        }
        return n;
    }
    function Za(kd, ld, ja) {
        var md, nd, error_code, od, pd, qd, rd, ad, sd;
        if (!(wa.cr0 & 1 << 31)) {
            wa.tlb_set_page(kd & -4096, kd & -4096, 1);
        } else {
            md = (wa.cr3 & -4096) + (kd >> 20 & 4092);
            nd = wa.ld32_phys(md);
            if (!(nd & 1)) {
                error_code = 0;
            } else {
                if (!(nd & 32)) {
                    nd |= 32;
                    wa.st32_phys(md, nd);
                }
                od = (nd & -4096) + (kd >> 10 & 4092);
                pd = wa.ld32_phys(od);
                if (!(pd & 1)) {
                    error_code = 0;
                } else {
                    qd = pd & nd;
                    if (ja && !(qd & 4)) {
                        error_code = 1;
                    } else if (ld && !(qd & 2)) {
                        error_code = 1;
                    } else {
                        rd = ld && !(pd & 64);
                        if (!(pd & 32) || rd) {
                            pd |= 32;
                            if (rd) pd |= 64;
                            wa.st32_phys(od, pd);
                        }
                        ad = 0;
                        if (pd & 64 && qd & 2) ad = 1;
                        sd = 0;
                        if (qd & 4) sd = 1;
                        wa.tlb_set_page(kd & -4096, pd & -4096, ad, sd);
                        return;
                    }
                }
            }
            error_code |= ld << 1;
            if (ja) error_code |= 4;
            wa.cr2 = kd;
            Wc(14, error_code);
        }
    }
    function td(ud) {
        if (!(ud & 1 << 0)) Uc("real mode not supported");
        if ((ud & (1 << 31 | 1 << 16 | 1 << 0)) != (wa.cr0 & (1 << 31 | 1 << 16 | 1 << 0))) {
            wa.tlb_flush_all();
        }
        wa.cr0 = ud | 1 << 4;
    }
    function vd(wd) {
        wa.cr3 = wd;
        if (wa.cr0 & 1 << 31) {
            wa.tlb_flush_all();
        }
    }
    function xd(yd) {
        wa.cr4 = yd;
    }
    function zd(Ad) {
        if (Ad & 1 << 22) return -1; else return 65535;
    }
    function Bd(selector) {
        var sa, Lb, Cd, Ad;
        if (selector & 4) sa = wa.ldt; else sa = wa.gdt;
        Lb = selector & ~7;
        if (Lb + 7 > sa.limit) return null;
        fa = sa.base + Lb;
        Cd = wb();
        fa += 4;
        Ad = wb();
        return [ Cd, Ad ];
    }
    function Dd(Cd, Ad) {
        var limit;
        limit = Cd & 65535 | Ad & 983040;
        if (Ad & 1 << 23) limit = limit << 12 | 4095;
        return limit;
    }
    function Ed(Cd, Ad) {
        return (Cd >>> 16 | (Ad & 255) << 16 | Ad & 4278190080) & -1;
    }
    function Fd(sa, Cd, Ad) {
        sa.base = Ed(Cd, Ad);
        sa.limit = Dd(Cd, Ad);
        sa.flags = Ad;
    }
    function Gd(Hd, selector, base, limit, flags) {
        wa.segs[Hd] = {
            selector: selector,
            base: base,
            limit: limit,
            flags: flags
        };
    }
    function Id(Jd) {
        var Kd, Lb, Ld, Md, Nd;
        if (!(wa.tr.flags & 1 << 15)) Uc("invalid tss");
        Kd = wa.tr.flags >> 8 & 15;
        if ((Kd & 7) != 1) Uc("invalid tss type");
        Ld = Kd >> 3;
        Lb = Jd * 4 + 2 << Ld;
        if (Lb + (4 << Ld) - 1 > wa.tr.limit) Wc(10, wa.tr.selector & 65532);
        fa = wa.tr.base + Lb & -1;
        if (Ld == 0) {
            Nd = ub();
            fa += 2;
        } else {
            Nd = wb();
            fa += 4;
        }
        Md = ub();
        return [ Md, Nd ];
    }
    function Od(intno, Pd, error_code, Qd, Rd) {
        var sa, Sd, Kd, Jd, selector, Td, Ud;
        var Vd, Wd, Ld;
        var e, Cd, Ad, Xd, Md, Nd, Yd, Zd;
        var ae, be;
        if (intno == 6) {
            var ce = Db;
            na = "do_interrupt: intno=" + qa(intno) + " error_code=" + pa(error_code) + " EIP=" + pa(ce) + " ESP=" + pa(xa[4]) + " EAX=" + pa(xa[0]) + " EBX=" + pa(xa[3]) + " ECX=" + pa(xa[1]);
            if (intno == 14) {
                na += " CR2=" + pa(wa.cr2);
            }
            console.log(na);
            if (intno == 6) {
                var na, i, n;
                na = "Code:";
                n = 4096 - (ce & 4095);
                if (n > 15) n = 15;
                for (i = 0; i < n; i++) {
                    fa = ce + i & -1;
                    na += " " + qa(ab());
                }
                console.log(na);
            }
        }
        Vd = 0;
        if (!Pd && !Rd) {
            switch (intno) {
              case 8:
              case 10:
              case 11:
              case 12:
              case 13:
              case 14:
              case 17:
                Vd = 1;
                break;
            }
        }
        if (Pd) ae = Qd; else ae = Db;
        sa = wa.idt;
        if (intno * 8 + 7 > sa.limit) Wc(13, intno * 8 + 2);
        fa = sa.base + intno * 8 & -1;
        Cd = wb();
        fa += 4;
        Ad = wb();
        Kd = Ad >> 8 & 31;
        switch (Kd) {
          case 5:
          case 7:
          case 6:
            throw "unsupported task gate";
          case 14:
          case 15:
            break;
          default:
            Wc(13, intno * 8 + 2);
            break;
        }
        Jd = Ad >> 13 & 3;
        Ud = wa.cpl;
        if (Pd && Jd < Ud) Wc(13, intno * 8 + 2);
        if (!(Ad & 1 << 15)) Wc(11, intno * 8 + 2);
        selector = Cd >> 16;
        Xd = Ad & -65536 | Cd & 65535;
        if ((selector & 65532) == 0) Wc(13, 0);
        e = Bd(selector);
        if (!e) Wc(13, selector & 65532);
        Cd = e[0];
        Ad = e[1];
        if (!(Ad & 1 << 12) || !(Ad & 1 << 11)) Wc(13, selector & 65532);
        Jd = Ad >> 13 & 3;
        if (Jd > Ud) Wc(13, selector & 65532);
        if (!(Ad & 1 << 15)) Wc(11, selector & 65532);
        if (!(Ad & 1 << 10) && Jd < Ud) {
            e = Id(Jd);
            Md = e[0];
            Nd = e[1];
            if ((Md & 65532) == 0) Wc(10, Md & 65532);
            if ((Md & 3) != Jd) Wc(10, Md & 65532);
            e = Bd(Md);
            if (!e) Wc(10, Md & 65532);
            Yd = e[0];
            Zd = e[1];
            Td = Zd >> 13 & 3;
            if (Td != Jd) Wc(10, Md & 65532);
            if (!(Zd & 1 << 12) || Zd & 1 << 11 || !(Zd & 1 << 9)) Wc(10, Md & 65532);
            if (!(Zd & 1 << 15)) Wc(10, Md & 65532);
            Wd = 1;
            be = zd(Zd);
            Sd = Ed(Yd, Zd);
        } else if (Ad & 1 << 10 || Jd == Ud) {
            if (wa.eflags & 131072) Wc(13, selector & 65532);
            Wd = 0;
            be = zd(wa.segs[2].flags);
            Sd = wa.segs[2].base;
            Nd = xa[4];
            Jd = Ud;
        } else {
            Wc(13, selector & 65532);
            Wd = 0;
            be = 0;
            Sd = 0;
            Nd = 0;
        }
        Ld = Kd >> 3;
        if (Wd) {
            if (wa.eflags & 131072) {
                {
                    Nd = Nd - 4 & -1;
                    fa = Sd + (Nd & be) & -1;
                    Cb(wa.segs[5].selector);
                }
                {
                    Nd = Nd - 4 & -1;
                    fa = Sd + (Nd & be) & -1;
                    Cb(wa.segs[4].selector);
                }
                {
                    Nd = Nd - 4 & -1;
                    fa = Sd + (Nd & be) & -1;
                    Cb(wa.segs[3].selector);
                }
                {
                    Nd = Nd - 4 & -1;
                    fa = Sd + (Nd & be) & -1;
                    Cb(wa.segs[0].selector);
                }
            }
            {
                Nd = Nd - 4 & -1;
                fa = Sd + (Nd & be) & -1;
                Cb(wa.segs[2].selector);
            }
            {
                Nd = Nd - 4 & -1;
                fa = Sd + (Nd & be) & -1;
                Cb(xa[4]);
            }
        }
        {
            Nd = Nd - 4 & -1;
            fa = Sd + (Nd & be) & -1;
            Cb(Pc());
        }
        {
            Nd = Nd - 4 & -1;
            fa = Sd + (Nd & be) & -1;
            Cb(wa.segs[1].selector);
        }
        {
            Nd = Nd - 4 & -1;
            fa = Sd + (Nd & be) & -1;
            Cb(ae);
        }
        if (Vd) {
            {
                Nd = Nd - 4 & -1;
                fa = Sd + (Nd & be) & -1;
                Cb(error_code);
            }
        }
        if (Wd) {
            if (wa.eflags & 131072) {
                Gd(0, 0, 0, 0, 0);
                Gd(3, 0, 0, 0, 0);
                Gd(4, 0, 0, 0, 0);
                Gd(5, 0, 0, 0, 0);
            }
            Md = Md & ~3 | Jd;
            Gd(2, Md, Sd, Dd(Yd, Zd), Zd);
        }
        xa[4] = xa[4] & ~be | Nd & be;
        selector = selector & ~3 | Jd;
        Gd(1, selector, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
        Xc(Jd);
        Db = Xd, Eb = Gb = 0;
        if ((Kd & 1) == 0) {
            wa.eflags &= ~512;
        }
        wa.eflags &= ~(256 | 131072 | 65536 | 16384);
    }
    function de(selector) {
        var sa, Cd, Ad, Lb, ee;
        selector &= 65535;
        if ((selector & 65532) == 0) {
            wa.ldt.base = 0;
            wa.ldt.limit = 0;
        } else {
            if (selector & 4) Wc(13, selector & 65532);
            sa = wa.gdt;
            Lb = selector & ~7;
            ee = 7;
            if (Lb + ee > sa.limit) Wc(13, selector & 65532);
            fa = sa.base + Lb & -1;
            Cd = wb();
            fa += 4;
            Ad = wb();
            if (Ad & 1 << 12 || (Ad >> 8 & 15) != 2) Wc(13, selector & 65532);
            if (!(Ad & 1 << 15)) Wc(11, selector & 65532);
            Fd(wa.ldt, Cd, Ad);
        }
        wa.ldt.selector = selector;
    }
    function fe(selector) {
        var sa, Cd, Ad, Lb, Kd, ee;
        selector &= 65535;
        if ((selector & 65532) == 0) {
            wa.tr.base = 0;
            wa.tr.limit = 0;
            wa.tr.flags = 0;
        } else {
            if (selector & 4) Wc(13, selector & 65532);
            sa = wa.gdt;
            Lb = selector & ~7;
            ee = 7;
            if (Lb + ee > sa.limit) Wc(13, selector & 65532);
            fa = sa.base + Lb & -1;
            Cd = wb();
            fa += 4;
            Ad = wb();
            Kd = Ad >> 8 & 15;
            if (Ad & 1 << 12 || Kd != 1 && Kd != 9) Wc(13, selector & 65532);
            if (!(Ad & 1 << 15)) Wc(11, selector & 65532);
            Fd(wa.tr, Cd, Ad);
            Ad |= 1 << 9;
            Cb(Ad);
        }
        wa.tr.selector = selector;
    }
    function ge(he, selector) {
        var Cd, Ad, Ud, Jd, ie, sa, Lb;
        selector &= 65535;
        Ud = wa.cpl;
        if ((selector & 65532) == 0) {
            if (he == 2) Wc(13, 0);
            Gd(he, selector, 0, 0, 0);
        } else {
            if (selector & 4) sa = wa.ldt; else sa = wa.gdt;
            Lb = selector & ~7;
            if (Lb + 7 > sa.limit) Wc(13, selector & 65532);
            fa = sa.base + Lb & -1;
            Cd = wb();
            fa += 4;
            Ad = wb();
            if (!(Ad & 1 << 12)) Wc(13, selector & 65532);
            ie = selector & 3;
            Jd = Ad >> 13 & 3;
            if (he == 2) {
                if (Ad & 1 << 11 || !(Ad & 1 << 9)) Wc(13, selector & 65532);
                if (ie != Ud || Jd != Ud) Wc(13, selector & 65532);
            } else {
                if ((Ad & (1 << 11 | 1 << 9)) == 1 << 11) Wc(13, selector & 65532);
                if (!(Ad & 1 << 11) || !(Ad & 1 << 10)) {
                    if (Jd < Ud || Jd < ie) Wc(13, selector & 65532);
                }
            }
            if (!(Ad & 1 << 15)) {
                if (he == 2) Wc(12, selector & 65532); else Wc(11, selector & 65532);
            }
            if (!(Ad & 1 << 8)) {
                Ad |= 1 << 8;
                Cb(Ad);
            }
            Gd(he, selector, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
        }
    }
    function je(ke, le) {
        var me, Kd, Cd, Ad, Ud, Jd, ie, limit, e;
        if ((ke & 65532) == 0) Wc(13, 0);
        e = Bd(ke);
        if (!e) Wc(13, ke & 65532);
        Cd = e[0];
        Ad = e[1];
        Ud = wa.cpl;
        if (Ad & 1 << 12) {
            if (!(Ad & 1 << 11)) Wc(13, ke & 65532);
            Jd = Ad >> 13 & 3;
            if (Ad & 1 << 10) {
                if (Jd > Ud) Wc(13, ke & 65532);
            } else {
                ie = ke & 3;
                if (ie > Ud) Wc(13, ke & 65532);
                if (Jd != Ud) Wc(13, ke & 65532);
            }
            if (!(Ad & 1 << 15)) Wc(11, ke & 65532);
            limit = Dd(Cd, Ad);
            if (le >>> 0 > limit >>> 0) Wc(13, ke & 65532);
            Gd(1, ke & 65532 | Ud, Ed(Cd, Ad), limit, Ad);
            Db = le, Eb = Gb = 0;
        } else {
            Uc("unsupported jump to call or task gate");
        }
    }
    function ne(he, Ud) {
        var Jd, Ad;
        if ((he == 4 || he == 5) && (wa.segs[he].selector & 65532) == 0) return;
        Ad = wa.segs[he].flags;
        Jd = Ad >> 13 & 3;
        if (!(Ad & 1 << 11) || !(Ad & 1 << 10)) {
            if (Jd < Ud) {
                Gd(he, 0, 0, 0, 0);
            }
        }
    }
    function oe(Ld, pe, qe) {
        var ke, re, se;
        var te, ue, ve, we;
        var e, Cd, Ad, Yd, Zd;
        var Ud, Jd, ie, xe, ye;
        var Sd, ze, le, Ae, be;
        be = zd(wa.segs[2].flags);
        ze = xa[4];
        Sd = wa.segs[2].base;
        re = 0;
        if (Ld == 1) {
            {
                fa = Sd + (ze & be) & -1;
                le = eb();
                ze = ze + 4 & -1;
            }
            {
                fa = Sd + (ze & be) & -1;
                ke = eb();
                ze = ze + 4 & -1;
            }
            ke &= 65535;
            if (pe) {
                {
                    fa = Sd + (ze & be) & -1;
                    re = eb();
                    ze = ze + 4 & -1;
                }
                if (re & 131072) throw "VM86 unsupported";
            }
        } else {
            throw "unsupported";
        }
        if ((ke & 65532) == 0) Wc(13, ke & 65532);
        e = Bd(ke);
        if (!e) Wc(13, ke & 65532);
        Cd = e[0];
        Ad = e[1];
        if (!(Ad & 1 << 12) || !(Ad & 1 << 11)) Wc(13, ke & 65532);
        Ud = wa.cpl;
        ie = ke & 3;
        if (ie < Ud) Wc(13, ke & 65532);
        Jd = Ad >> 13 & 3;
        if (Ad & 1 << 10) {
            if (Jd > ie) Wc(13, ke & 65532);
        } else {
            if (Jd != ie) Wc(13, ke & 65532);
        }
        if (!(Ad & 1 << 15)) Wc(11, ke & 65532);
        ze = ze + qe & -1;
        if (ie == Ud) {
            Gd(1, ke, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
        } else {
            if (Ld == 1) {
                {
                    fa = Sd + (ze & be) & -1;
                    Ae = eb();
                    ze = ze + 4 & -1;
                }
                {
                    fa = Sd + (ze & be) & -1;
                    se = eb();
                    ze = ze + 4 & -1;
                }
                se &= 65535;
            } else {
                throw "unsupported";
            }
            if ((se & 65532) == 0) {
                Wc(13, 0);
            } else {
                if ((se & 3) != ie) Wc(13, se & 65532);
                e = Bd(se);
                if (!e) Wc(13, se & 65532);
                Yd = e[0];
                Zd = e[1];
                if (!(Zd & 1 << 12) || Zd & 1 << 11 || !(Zd & 1 << 9)) Wc(13, se & 65532);
                Jd = Zd >> 13 & 3;
                if (Jd != ie) Wc(13, se & 65532);
                if (!(Zd & 1 << 15)) Wc(11, se & 65532);
                Gd(2, se, Ed(Yd, Zd), Dd(Yd, Zd), Zd);
            }
            Gd(1, ke, Ed(Cd, Ad), Dd(Cd, Ad), Ad);
            Xc(ie);
            ze = Ae;
            be = zd(Zd);
            ne(0, ie);
            ne(3, ie);
            ne(4, ie);
            ne(5, ie);
            ze = ze + qe & -1;
        }
        xa[4] = xa[4] & ~be | ze & be;
        Db = le, Eb = Gb = 0;
        if (pe) {
            xe = 256 | 262144 | 2097152 | 65536 | 16384;
            if (Ud == 0) xe |= 12288;
            ye = wa.eflags >> 12 & 3;
            if (Ud <= ye) xe |= 512;
            if (Ld == 0) xe &= 65535;
            Rc(re, xe);
        }
    }
    function Be(Ld) {
        if (wa.eflags & 16384) {
            Wc(13, 0);
        } else {
            oe(Ld, 1, 0);
        }
    }
    function Ce() {
        var Lb;
        Lb = xa[0];
        switch (Lb) {
          case 0:
            xa[0] = 1;
            xa[3] = 1970169159 & -1;
            xa[2] = 1231384169 & -1;
            xa[1] = 1818588270 & -1;
            break;
          case 1:
          default:
            xa[0] = 5 << 8 | 4 << 4 | 3;
            xa[3] = 8 << 8;
            xa[1] = 0;
            xa[2] = 1 << 4;
            break;
        }
    }
    function De(base) {
        var Ee, Fe;
        if (base == 0) rc(0);
        Ee = xa[0] & 255;
        Fe = Ee / base & -1;
        Ee = Ee % base;
        xa[0] = xa[0] & ~65535 | Ee | Fe << 8;
        za = Ee;
        Aa = 12;
    }
    function Ge(base) {
        var Ee, Fe;
        Ee = xa[0] & 255;
        Fe = xa[0] >> 8 & 255;
        Ee = Fe * base + Ee & 255;
        xa[0] = xa[0] & ~65535 | Ee;
        za = Ee;
        Aa = 12;
    }
    function He() {
        var Ie, Ee, Fe, Je, Qc;
        Qc = ec();
        Je = Qc & 16;
        Ee = xa[0] & 255;
        Fe = xa[0] >> 8 & 255;
        Ie = Ee > 249;
        if ((Ee & 15) > 9 || Je) {
            Ee = Ee + 6 & 15;
            Fe = Fe + 1 + Ie & 255;
            Qc |= 1 | 16;
        } else {
            Qc &= ~(1 | 16);
            Ee &= 15;
        }
        xa[0] = xa[0] & ~65535 | Ee | Fe << 8;
        ya = Qc;
        Aa = 24;
    }
    function Ke() {
        var Ie, Ee, Fe, Je, Qc;
        Qc = ec();
        Je = Qc & 16;
        Ee = xa[0] & 255;
        Fe = xa[0] >> 8 & 255;
        Ie = Ee < 6;
        if ((Ee & 15) > 9 || Je) {
            Ee = Ee - 6 & 15;
            Fe = Fe - 1 - Ie & 255;
            Qc |= 1 | 16;
        } else {
            Qc &= ~(1 | 16);
            Ee &= 15;
        }
        xa[0] = xa[0] & ~65535 | Ee | Fe << 8;
        ya = Qc;
        Aa = 24;
    }
    function Le() {
        var Ee, Je, Me, Qc;
        Qc = ec();
        Me = Qc & 1;
        Je = Qc & 16;
        Ee = xa[0] & 255;
        Qc = 0;
        if ((Ee & 15) > 9 || Je) {
            Ee = Ee + 6 & 255;
            Qc |= 16;
        }
        if (Ee > 159 || Me) {
            Ee = Ee + 96 & 255;
            Qc |= 1;
        }
        xa[0] = xa[0] & ~255 | Ee;
        Qc |= (Ee == 0) << 6;
        Qc |= aa[Ee] << 2;
        Qc |= Ee & 128;
        ya = Qc;
        Aa = 24;
    }
    function Ne() {
        var Ee, Oe, Je, Me, Qc;
        Qc = ec();
        Me = Qc & 1;
        Je = Qc & 16;
        Ee = xa[0] & 255;
        Qc = 0;
        Oe = Ee;
        if ((Ee & 15) > 9 || Je) {
            Qc |= 16;
            if (Ee < 6 || Me) Qc |= 1;
            Ee = Ee - 6 & 255;
        }
        if (Oe > 153 || Me) {
            Ee = Ee - 96 & 255;
            Qc |= 1;
        }
        xa[0] = xa[0] & ~255 | Ee;
        Qc |= (Ee == 0) << 6;
        Qc |= aa[Ee] << 2;
        Qc |= Ee & 128;
        ya = Qc;
        Aa = 24;
    }
    function Pe() {
        var Ea, ga, Ha, Ia;
        Ea = Na[Eb++];
        if (Ea >> 3 == 3) rc(6);
        fa = Ib(Ea);
        ga = eb();
        fa = fa + 4 & -1;
        Ha = eb();
        Ga = Ea >> 3 & 7;
        Ia = xa[Ga];
        if (Ia < ga || Ia > Ha) rc(5);
    }
    function Qe() {
        var Ea, ga, Ha, Ia;
        Ea = Na[Eb++];
        if (Ea >> 3 == 3) rc(6);
        fa = Ib(Ea);
        ga = cb() << 16 >> 16;
        fa = fa + 2 & -1;
        Ha = cb() << 16 >> 16;
        Ga = Ea >> 3 & 7;
        Ia = xa[Ga] << 16 >> 16;
        if (Ia < ga || Ia > Ha) rc(5);
    }
    wa = this;
    Na = this.phys_mem8;
    Pa = this.phys_mem16;
    Qa = this.phys_mem32;
    Ta = this.tlb_read_user;
    Ua = this.tlb_write_user;
    Ra = this.tlb_read_kernel;
    Sa = this.tlb_write_kernel;
    if (wa.cpl == 3) {
        Va = Ta;
        Wa = Ua;
    } else {
        Va = Ra;
        Wa = Sa;
    }
    if (wa.halted) {
        if (wa.hard_irq != 0 && wa.eflags & 512) {
            wa.halted = 0;
        } else {
            return 257;
        }
    }
    xa = this.regs;
    ya = this.cc_src;
    za = this.cc_dst;
    Aa = this.cc_op;
    Ba = this.cc_op2;
    Ca = this.cc_dst2;
    Db = this.eip;
    La = 256;
    Ka = ua;
    if (va) {
        Od(va.intno, 0, va.error_code, 0, 0);
    }
    if (wa.hard_intno >= 0) {
        Od(wa.hard_intno, 0, 0, 0, 1);
        wa.hard_intno = -1;
    }
    if (wa.hard_irq != 0 && wa.eflags & 512) {
        wa.hard_intno = wa.get_hard_intno();
        Od(wa.hard_intno, 0, 0, 0, 1);
        wa.hard_intno = -1;
    }
    Eb = 0;
    Gb = 0;
    Re : do {
        Da = 0;
        Db = Db + Eb - Gb >> 0;
        Fb = Va[Db >>> 12];
        if (((Fb | Db) & 4095) >= 4096 - 15 + 1) {
            var Se;
            if (Fb == -1) Za(Db, 0, wa.cpl == 3);
            Fb = Va[Db >>> 12];
            Gb = Eb = Db ^ Fb;
            b = Na[Eb++];
            Se = Db & 4095;
            if (Se >= 4096 - 15 + 1) {
                ga = hd(Db, b);
                if (Se + ga > 4096) {
                    Gb = Eb = this.mem_size;
                    for (Ha = 0; Ha < ga; Ha++) {
                        fa = Db + Ha >> 0;
                        Na[Eb + Ha] = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                    }
                    Eb++;
                }
            }
        } else {
            Gb = Eb = Db ^ Fb;
            b = Na[Eb++];
        }
        if (0) {
            console.log("exec: EIP=" + pa(Db) + " OPCODE=" + pa(b));
        }
        jd : for (;;) {
            switch (b) {
              case 102:
                if (Da == 0) hd(Db, b);
                Da |= 256;
                b = Na[Eb++];
                b |= Da & 256;
                break;
              case 240:
                if (Da == 0) hd(Db, b);
                Da |= 64;
                b = Na[Eb++];
                b |= Da & 256;
                break;
              case 242:
                if (Da == 0) hd(Db, b);
                Da |= 32;
                b = Na[Eb++];
                b |= Da & 256;
                break;
              case 243:
                if (Da == 0) hd(Db, b);
                Da |= 16;
                b = Na[Eb++];
                b |= Da & 256;
                break;
              case 100:
                if (Da == 0) hd(Db, b);
                Da = Da & ~15 | 4 + 1;
                b = Na[Eb++];
                b |= Da & 256;
                break;
              case 101:
                if (Da == 0) hd(Db, b);
                Da = Da & ~15 | 5 + 1;
                b = Na[Eb++];
                b |= Da & 256;
                break;
              case 176:
              case 177:
              case 178:
              case 179:
              case 180:
              case 181:
              case 182:
              case 183:
                ga = Na[Eb++];
                b &= 7;
                Oa = (b & 4) << 1;
                xa[b & 3] = xa[b & 3] & ~(255 << Oa) | (ga & 255) << Oa;
                break jd;
              case 184:
              case 185:
              case 186:
              case 187:
              case 188:
              case 189:
              case 190:
              case 191:
                {
                    ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                xa[b & 7] = ga;
                break jd;
              case 136:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                ga = xa[Ga & 3] >> ((Ga & 4) << 1) & 255;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Oa = (Fa & 4) << 1;
                    xa[Fa & 3] = xa[Fa & 3] & ~(255 << Oa) | (ga & 255) << Oa;
                } else {
                    fa = Ib(Ea);
                    {
                        Oa = Wa[fa >>> 12];
                        if (Oa == -1) {
                            lb(ga);
                        } else {
                            Na[fa ^ Oa] = ga;
                        }
                    }
                }
                break jd;
              case 137:
                Ea = Na[Eb++];
                ga = xa[Ea >> 3 & 7];
                if (Ea >> 6 == 3) {
                    xa[Ea & 7] = ga;
                } else {
                    fa = Ib(Ea);
                    {
                        Oa = Wa[fa >>> 12];
                        if ((Oa | fa) & 3) {
                            pb(ga);
                        } else {
                            Qa[(fa ^ Oa) >> 2] = ga;
                        }
                    }
                }
                break jd;
              case 138:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                } else {
                    fa = Ib(Ea);
                    ga = (Oa = Va[fa >>> 12]) == -1 ? Xa() : Na[fa ^ Oa];
                }
                Ga = Ea >> 3 & 7;
                Oa = (Ga & 4) << 1;
                xa[Ga & 3] = xa[Ga & 3] & ~(255 << Oa) | (ga & 255) << Oa;
                break jd;
              case 139:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    ga = xa[Ea & 7];
                } else {
                    fa = Ib(Ea);
                    ga = ((Oa = Va[fa >>> 12]) | fa) & 3 ? db() : Qa[(fa ^ Oa) >> 2];
                }
                xa[Ea >> 3 & 7] = ga;
                break jd;
              case 160:
                fa = Mb();
                ga = ab();
                xa[0] = xa[0] & -256 | ga;
                break jd;
              case 161:
                fa = Mb();
                ga = eb();
                xa[0] = ga;
                break jd;
              case 162:
                fa = Mb();
                mb(xa[0]);
                break jd;
              case 163:
                fa = Mb();
                qb(xa[0]);
                break jd;
              case 215:
                fa = xa[3] + (xa[0] & 255) & -1;
                if (Da & 15) {
                    fa = fa + wa.segs[(Da & 15) - 1].base & -1;
                }
                ga = ab();
                Nb(0, ga);
                break jd;
              case 198:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    ga = Na[Eb++];
                    Nb(Ea & 7, ga);
                } else {
                    fa = Ib(Ea);
                    ga = Na[Eb++];
                    mb(ga);
                }
                break jd;
              case 199:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    {
                        ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                        Eb += 4;
                    }
                    xa[Ea & 7] = ga;
                } else {
                    fa = Ib(Ea);
                    {
                        ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                        Eb += 4;
                    }
                    qb(ga);
                }
                break jd;
              case 145:
              case 146:
              case 147:
              case 148:
              case 149:
              case 150:
              case 151:
                Ga = b & 7;
                ga = xa[0];
                xa[0] = xa[Ga];
                xa[Ga] = ga;
                break jd;
              case 134:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    Nb(Fa, xa[Ga & 3] >> ((Ga & 4) << 1) & 255);
                } else {
                    fa = Ib(Ea);
                    ga = gb();
                    mb(xa[Ga & 3] >> ((Ga & 4) << 1) & 255);
                }
                Nb(Ga, ga);
                break jd;
              case 135:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    ga = xa[Fa];
                    xa[Fa] = xa[Ga];
                } else {
                    fa = Ib(Ea);
                    ga = kb();
                    qb(xa[Ga]);
                }
                xa[Ga] = ga;
                break jd;
              case 142:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                if (Ga >= 6 || Ga == 1) rc(6);
                if (Ea >> 6 == 3) {
                    ga = xa[Ea & 7] & 65535;
                } else {
                    fa = Ib(Ea);
                    ga = cb();
                }
                ge(Ga, ga);
                break jd;
              case 140:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                if (Ga >= 6) rc(6);
                ga = wa.segs[Ga].selector;
                if (Ea >> 6 == 3) {
                    xa[Ea & 7] = ga;
                } else {
                    fa = Ib(Ea);
                    ob(ga);
                }
                break jd;
              case 196:
                {
                    Ea = Na[Eb++];
                    if (Ea >> 3 == 3) rc(6);
                    fa = Ib(Ea);
                    ga = eb();
                    fa += 4;
                    Ha = cb();
                    ge(0, Ha);
                    xa[Ea >> 3 & 7] = ga;
                }
                break jd;
              case 197:
                {
                    Ea = Na[Eb++];
                    if (Ea >> 3 == 3) rc(6);
                    fa = Ib(Ea);
                    ga = eb();
                    fa += 4;
                    Ha = cb();
                    ge(3, Ha);
                    xa[Ea >> 3 & 7] = ga;
                }
                break jd;
              case 0:
              case 8:
              case 16:
              case 24:
              case 32:
              case 40:
              case 48:
              case 56:
                Ea = Na[Eb++];
                Ja = b >> 3;
                Ga = Ea >> 3 & 7;
                Ha = xa[Ga & 3] >> ((Ga & 4) << 1) & 255;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Nb(Fa, Pb(Ja, xa[Fa & 3] >> ((Fa & 4) << 1) & 255, Ha));
                } else {
                    fa = Ib(Ea);
                    if (Ja != 7) {
                        ga = gb();
                        ga = Pb(Ja, ga, Ha);
                        mb(ga);
                    } else {
                        ga = ab();
                        Pb(7, ga, Ha);
                    }
                }
                break jd;
              case 1:
              case 9:
              case 17:
              case 25:
              case 33:
              case 41:
              case 49:
                Ea = Na[Eb++];
                Ja = b >> 3;
                Ha = xa[Ea >> 3 & 7];
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    xa[Fa] = Zb(Ja, xa[Fa], Ha);
                } else {
                    fa = Ib(Ea);
                    ga = kb();
                    ga = Zb(Ja, ga, Ha);
                    qb(ga);
                }
                break jd;
              case 57:
                Ea = Na[Eb++];
                Ja = b >> 3;
                Ha = xa[Ea >> 3 & 7];
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    {
                        ya = Ha;
                        za = xa[Fa] - ya & -1;
                        Aa = 8;
                    }
                } else {
                    fa = Ib(Ea);
                    ga = eb();
                    {
                        ya = Ha;
                        za = ga - ya & -1;
                        Aa = 8;
                    }
                }
                break jd;
              case 2:
              case 10:
              case 18:
              case 26:
              case 34:
              case 42:
              case 50:
              case 58:
                Ea = Na[Eb++];
                Ja = b >> 3;
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Ha = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                } else {
                    fa = Ib(Ea);
                    Ha = ab();
                }
                Nb(Ga, Pb(Ja, xa[Ga & 3] >> ((Ga & 4) << 1) & 255, Ha));
                break jd;
              case 3:
              case 11:
              case 19:
              case 27:
              case 35:
              case 43:
              case 51:
                Ea = Na[Eb++];
                Ja = b >> 3;
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Ha = xa[Ea & 7];
                } else {
                    fa = Ib(Ea);
                    Ha = eb();
                }
                xa[Ga] = Zb(Ja, xa[Ga], Ha);
                break jd;
              case 59:
                Ea = Na[Eb++];
                Ja = b >> 3;
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Ha = xa[Ea & 7];
                } else {
                    fa = Ib(Ea);
                    Ha = eb();
                }
                {
                    ya = Ha;
                    za = xa[Ga] - ya & -1;
                    Aa = 8;
                }
                break jd;
              case 4:
              case 12:
              case 20:
              case 28:
              case 36:
              case 44:
              case 52:
              case 60:
                Ha = Na[Eb++];
                Ja = b >> 3;
                Nb(0, Pb(Ja, xa[0] & 255, Ha));
                break jd;
              case 5:
              case 13:
              case 21:
              case 29:
              case 37:
              case 45:
              case 53:
              case 61:
                {
                    Ha = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                Ja = b >> 3;
                xa[0] = Zb(Ja, xa[0], Ha);
                break jd;
              case 128:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Ha = Na[Eb++];
                    Nb(Fa, Pb(Ja, xa[Fa & 3] >> ((Fa & 4) << 1) & 255, Ha));
                } else {
                    fa = Ib(Ea);
                    Ha = Na[Eb++];
                    if (Ja != 7) {
                        ga = gb();
                        ga = Pb(Ja, ga, Ha);
                        mb(ga);
                    } else {
                        ga = ab();
                        Pb(7, ga, Ha);
                    }
                }
                break jd;
              case 129:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    {
                        Ha = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                        Eb += 4;
                    }
                    xa[Fa] = Zb(Ja, xa[Fa], Ha);
                } else {
                    fa = Ib(Ea);
                    {
                        Ha = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                        Eb += 4;
                    }
                    if (Ja != 7) {
                        ga = kb();
                        ga = Zb(Ja, ga, Ha);
                        qb(ga);
                    } else {
                        ga = eb();
                        Zb(7, ga, Ha);
                    }
                }
                break jd;
              case 131:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Ha = Na[Eb++] << 24 >> 24;
                    xa[Fa] = Zb(Ja, xa[Fa], Ha);
                } else {
                    fa = Ib(Ea);
                    Ha = Na[Eb++] << 24 >> 24;
                    if (Ja != 7) {
                        ga = kb();
                        ga = Zb(Ja, ga, Ha);
                        qb(ga);
                    } else {
                        ga = eb();
                        Zb(7, ga, Ha);
                    }
                }
                break jd;
              case 64:
              case 65:
              case 66:
              case 67:
              case 68:
              case 69:
              case 70:
              case 71:
                Ga = b & 7;
                {
                    if (Aa < 25) {
                        Ba = Aa;
                    }
                    xa[Ga] = Ca = xa[Ga] + 1 & -1;
                    Aa = 27;
                }
                break jd;
              case 72:
              case 73:
              case 74:
              case 75:
              case 76:
              case 77:
              case 78:
              case 79:
                Ga = b & 7;
                {
                    if (Aa < 25) {
                        Ba = Aa;
                    }
                    xa[Ga] = Ca = xa[Ga] - 1 & -1;
                    Aa = 30;
                }
                break jd;
              case 107:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Ha = xa[Ea & 7];
                } else {
                    fa = Ib(Ea);
                    Ha = eb();
                }
                Ia = Na[Eb++] << 24 >> 24;
                xa[Ga] = Kc(Ha, Ia);
                break jd;
              case 105:
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Ha = xa[Ea & 7];
                } else {
                    fa = Ib(Ea);
                    Ha = eb();
                }
                {
                    Ia = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                xa[Ga] = Kc(Ha, Ia);
                break jd;
              case 132:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                } else {
                    fa = Ib(Ea);
                    ga = ab();
                }
                Ga = Ea >> 3 & 7;
                Ha = xa[Ga & 3] >> ((Ga & 4) << 1) & 255;
                za = ga & Ha;
                Aa = 12;
                break jd;
              case 133:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    ga = xa[Ea & 7];
                } else {
                    fa = Ib(Ea);
                    ga = eb();
                }
                Ha = xa[Ea >> 3 & 7];
                za = ga & Ha;
                Aa = 14;
                break jd;
              case 168:
                Ha = Na[Eb++];
                za = xa[0] & Ha;
                Aa = 12;
                break jd;
              case 169:
                {
                    Ha = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                za = xa[0] & Ha;
                Aa = 14;
                break jd;
              case 246:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                switch (Ja) {
                  case 0:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    Ha = Na[Eb++];
                    za = ga & Ha;
                    Aa = 12;
                    break;
                  case 2:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Nb(Fa, ~(xa[Fa & 3] >> ((Fa & 4) << 1) & 255));
                    } else {
                        fa = Ib(Ea);
                        ga = gb();
                        ga = ~ga;
                        mb(ga);
                    }
                    break;
                  case 3:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Nb(Fa, Pb(5, 0, xa[Fa & 3] >> ((Fa & 4) << 1) & 255));
                    } else {
                        fa = Ib(Ea);
                        ga = gb();
                        ga = Pb(5, 0, ga);
                        mb(ga);
                    }
                    break;
                  case 4:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    Ob(0, Cc(xa[0], ga));
                    break;
                  case 5:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    Ob(0, Dc(xa[0], ga));
                    break;
                  case 6:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    qc(ga);
                    break;
                  case 7:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    sc(ga);
                    break;
                  default:
                    rc(6);
                }
                break jd;
              case 247:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                switch (Ja) {
                  case 0:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    {
                        Ha = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                        Eb += 4;
                    }
                    za = ga & Ha;
                    Aa = 14;
                    break;
                  case 2:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = ~xa[Fa];
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        ga = ~ga;
                        qb(ga);
                    }
                    break;
                  case 3:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = Zb(5, 0, xa[Fa]);
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        ga = Zb(5, 0, ga);
                        qb(ga);
                    }
                    break;
                  case 4:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    xa[0] = Jc(xa[0], ga);
                    xa[2] = Ma;
                    break;
                  case 5:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    xa[0] = Kc(xa[0], ga);
                    xa[2] = Ma;
                    break;
                  case 6:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    xa[0] = vc(xa[2], xa[0], ga);
                    xa[2] = Ma;
                    break;
                  case 7:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    xa[0] = zc(xa[2], xa[0], ga);
                    xa[2] = Ma;
                    break;
                  default:
                    rc(6);
                }
                break jd;
              case 192:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Ha = Na[Eb++];
                    Fa = Ea & 7;
                    Nb(Fa, cc(Ja, xa[Fa & 3] >> ((Fa & 4) << 1) & 255, Ha));
                } else {
                    fa = Ib(Ea);
                    Ha = Na[Eb++];
                    ga = gb();
                    ga = cc(Ja, ga, Ha);
                    mb(ga);
                }
                break jd;
              case 193:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Ha = Na[Eb++];
                    Fa = Ea & 7;
                    xa[Fa] = gc(Ja, xa[Fa], Ha);
                } else {
                    fa = Ib(Ea);
                    Ha = Na[Eb++];
                    ga = kb();
                    ga = gc(Ja, ga, Ha);
                    qb(ga);
                }
                break jd;
              case 208:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Nb(Fa, cc(Ja, xa[Fa & 3] >> ((Fa & 4) << 1) & 255, 1));
                } else {
                    fa = Ib(Ea);
                    ga = gb();
                    ga = cc(Ja, ga, 1);
                    mb(ga);
                }
                break jd;
              case 209:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    xa[Fa] = gc(Ja, xa[Fa], 1);
                } else {
                    fa = Ib(Ea);
                    ga = kb();
                    ga = gc(Ja, ga, 1);
                    qb(ga);
                }
                break jd;
              case 210:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                Ha = xa[1] & 255;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    Nb(Fa, cc(Ja, xa[Fa & 3] >> ((Fa & 4) << 1) & 255, Ha));
                } else {
                    fa = Ib(Ea);
                    ga = gb();
                    ga = cc(Ja, ga, Ha);
                    mb(ga);
                }
                break jd;
              case 211:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                Ha = xa[1] & 255;
                if (Ea >> 6 == 3) {
                    Fa = Ea & 7;
                    xa[Fa] = gc(Ja, xa[Fa], Ha);
                } else {
                    fa = Ib(Ea);
                    ga = kb();
                    ga = gc(Ja, ga, Ha);
                    qb(ga);
                }
                break jd;
              case 152:
                xa[0] = xa[0] << 16 >> 16;
                break jd;
              case 153:
                xa[2] = xa[0] >> 31;
                break jd;
              case 80:
              case 81:
              case 82:
              case 83:
              case 84:
              case 85:
              case 86:
              case 87:
                ga = xa[b & 7];
                fa = xa[4] - 4 & -1;
                {
                    Oa = Wa[fa >>> 12];
                    if ((Oa | fa) & 3) {
                        pb(ga);
                    } else {
                        Qa[(fa ^ Oa) >> 2] = ga;
                    }
                }
                xa[4] = fa;
                break jd;
              case 88:
              case 89:
              case 90:
              case 91:
              case 92:
              case 93:
              case 94:
              case 95:
                fa = xa[4];
                ga = ((Oa = Va[fa >>> 12]) | fa) & 3 ? db() : Qa[(fa ^ Oa) >> 2];
                xa[4] = fa + 4 & -1;
                xa[b & 7] = ga;
                break jd;
              case 96:
                fa = xa[4] - 32 & -1;
                Ha = fa;
                for (Ga = 7; Ga >= 0; Ga--) {
                    ga = xa[Ga];
                    {
                        Oa = Wa[fa >>> 12];
                        if ((Oa | fa) & 3) {
                            pb(ga);
                        } else {
                            Qa[(fa ^ Oa) >> 2] = ga;
                        }
                    }
                    fa = fa + 4 & -1;
                }
                xa[4] = Ha;
                break jd;
              case 97:
                fa = xa[4];
                for (Ga = 7; Ga >= 0; Ga--) {
                    if (Ga != 4) {
                        xa[Ga] = ((Oa = Va[fa >>> 12]) | fa) & 3 ? db() : Qa[(fa ^ Oa) >> 2];
                    }
                    fa = fa + 4 & -1;
                }
                xa[4] = fa;
                break jd;
              case 143:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) {
                    fa = xa[4];
                    ga = eb();
                    xa[4] = fa + 4 & -1;
                    xa[Ea & 7] = ga;
                } else {
                    fa = xa[4];
                    ga = eb();
                    fa = Ib(Ea, 4);
                    qb(ga);
                    xa[4] = xa[4] + 4 & -1;
                }
                break jd;
              case 104:
                {
                    ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                fa = xa[4] - 4 & -1;
                qb(ga);
                xa[4] = fa;
                break jd;
              case 106:
                ga = Na[Eb++] << 24 >> 24;
                fa = xa[4] - 4 & -1;
                qb(ga);
                xa[4] = fa;
                break jd;
              case 201:
                fa = xa[5];
                ga = eb();
                xa[5] = ga;
                xa[4] = fa + 4 & -1;
                break jd;
              case 156:
                ga = Pc();
                fa = xa[4] - 4 & -1;
                qb(ga);
                xa[4] = fa;
                break jd;
              case 157:
                fa = xa[4];
                ga = eb();
                xa[4] = fa + 4 & -1;
                if (wa.cpl == 0) {
                    Rc(ga, 256 | 262144 | 2097152 | 16384 | 512 | 12288);
                    {
                        if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                    }
                } else {
                    var ye;
                    ye = wa.eflags >> 12 & 3;
                    if (wa.cpl <= ye) {
                        Rc(ga, 256 | 262144 | 2097152 | 16384 | 512);
                        {
                            if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                        }
                    } else {
                        Rc(ga, 256 | 262144 | 2097152 | 16384);
                    }
                }
                break jd;
              case 6:
                {
                    ga = wa.segs[0].selector;
                    fa = xa[4] - 4 & -1;
                    qb(ga);
                    xa[4] = fa;
                }
                break jd;
              case 14:
                {
                    ga = wa.segs[1].selector;
                    fa = xa[4] - 4 & -1;
                    qb(ga);
                    xa[4] = fa;
                }
                break jd;
              case 22:
                {
                    ga = wa.segs[2].selector;
                    fa = xa[4] - 4 & -1;
                    qb(ga);
                    xa[4] = fa;
                }
                break jd;
              case 30:
                {
                    ga = wa.segs[3].selector;
                    fa = xa[4] - 4 & -1;
                    qb(ga);
                    xa[4] = fa;
                }
                break jd;
              case 7:
                {
                    fa = xa[4];
                    ga = eb();
                    ge(0, ga & 65535);
                    xa[4] = xa[4] + 4 & -1;
                }
                break jd;
              case 23:
                {
                    fa = xa[4];
                    ga = eb();
                    ge(2, ga & 65535);
                    xa[4] = xa[4] + 4 & -1;
                }
                break jd;
              case 31:
                {
                    fa = xa[4];
                    ga = eb();
                    ge(3, ga & 65535);
                    xa[4] = xa[4] + 4 & -1;
                }
                break jd;
              case 141:
                Ea = Na[Eb++];
                if (Ea >> 6 == 3) rc(6);
                Da &= ~15;
                xa[Ea >> 3 & 7] = Ib(Ea);
                break jd;
              case 254:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                switch (Ja) {
                  case 0:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Nb(Fa, Ub(xa[Fa & 3] >> ((Fa & 4) << 1) & 255));
                    } else {
                        fa = Ib(Ea);
                        ga = gb();
                        ga = Ub(ga);
                        mb(ga);
                    }
                    break;
                  case 1:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Nb(Fa, Vb(xa[Fa & 3] >> ((Fa & 4) << 1) & 255));
                    } else {
                        fa = Ib(Ea);
                        ga = gb();
                        ga = Vb(ga);
                        mb(ga);
                    }
                    break;
                  default:
                    rc(6);
                }
                break jd;
              case 255:
                Ea = Na[Eb++];
                Ja = Ea >> 3 & 7;
                switch (Ja) {
                  case 0:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        {
                            if (Aa < 25) {
                                Ba = Aa;
                            }
                            xa[Fa] = Ca = xa[Fa] + 1 & -1;
                            Aa = 27;
                        }
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        {
                            if (Aa < 25) {
                                Ba = Aa;
                            }
                            ga = Ca = ga + 1 & -1;
                            Aa = 27;
                        }
                        qb(ga);
                    }
                    break;
                  case 1:
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        {
                            if (Aa < 25) {
                                Ba = Aa;
                            }
                            xa[Fa] = Ca = xa[Fa] - 1 & -1;
                            Aa = 30;
                        }
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        {
                            if (Aa < 25) {
                                Ba = Aa;
                            }
                            ga = Ca = ga - 1 & -1;
                            Aa = 30;
                        }
                        qb(ga);
                    }
                    break;
                  case 2:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    fa = xa[4] - 4 & -1;
                    qb(Db + Eb - Gb);
                    xa[4] = fa;
                    Db = ga, Eb = Gb = 0;
                    break;
                  case 4:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    Db = ga, Eb = Gb = 0;
                    break;
                  case 6:
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    fa = xa[4] - 4 & -1;
                    qb(ga);
                    xa[4] = fa;
                    break;
                  case 3:
                  case 5:
                  default:
                    throw "GRP5";
                }
                break jd;
              case 235:
                ga = Na[Eb++] << 24 >> 24;
                Eb = Eb + ga >> 0;
                break jd;
              case 233:
                {
                    ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                Eb = Eb + ga >> 0;
                break jd;
              case 234:
                {
                    ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                Ha = Hb();
                je(Ha, ga);
                break jd;
              case 112:
              case 113:
              case 114:
              case 115:
              case 118:
              case 119:
              case 120:
              case 121:
              case 122:
              case 123:
              case 124:
              case 125:
              case 126:
              case 127:
                if (Tb(b & 15)) {
                    ga = Na[Eb++] << 24 >> 24;
                    Eb = Eb + ga >> 0;
                } else {
                    Eb = Eb + 1 >> 0;
                }
                break jd;
              case 116:
                switch (Aa) {
                  case 0:
                  case 3:
                  case 6:
                  case 9:
                  case 12:
                  case 15:
                  case 18:
                  case 21:
                    Ha = (za & 255) == 0;
                    break;
                  case 1:
                  case 4:
                  case 7:
                  case 10:
                  case 13:
                  case 16:
                  case 19:
                  case 22:
                    Ha = (za & 65535) == 0;
                    break;
                  case 2:
                  case 5:
                  case 8:
                  case 11:
                  case 14:
                  case 17:
                  case 20:
                  case 23:
                    Ha = za == 0;
                    break;
                  case 24:
                    Ha = ya >> 6 & 1;
                    break;
                  case 25:
                  case 28:
                    Ha = (Ca & 255) == 0;
                    break;
                  case 26:
                  case 29:
                    Ha = (Ca & 65535) == 0;
                    break;
                  case 27:
                  case 30:
                    Ha = Ca == 0;
                    break;
                  default:
                    throw "JZ: unsupported cc_op=" + Aa;
                }
                if (Ha) {
                    ga = Na[Eb++] << 24 >> 24;
                    Eb = Eb + ga >> 0;
                } else {
                    Eb = Eb + 1 >> 0;
                }
                break jd;
              case 117:
                switch (Aa) {
                  case 0:
                  case 3:
                  case 6:
                  case 9:
                  case 12:
                  case 15:
                  case 18:
                  case 21:
                    Ha = (za & 255) == 0;
                    break;
                  case 1:
                  case 4:
                  case 7:
                  case 10:
                  case 13:
                  case 16:
                  case 19:
                  case 22:
                    Ha = (za & 65535) == 0;
                    break;
                  case 2:
                  case 5:
                  case 8:
                  case 11:
                  case 14:
                  case 17:
                  case 20:
                  case 23:
                    Ha = za == 0;
                    break;
                  case 24:
                    Ha = ya >> 6 & 1;
                    break;
                  case 25:
                  case 28:
                    Ha = (Ca & 255) == 0;
                    break;
                  case 26:
                  case 29:
                    Ha = (Ca & 65535) == 0;
                    break;
                  case 27:
                  case 30:
                    Ha = Ca == 0;
                    break;
                  default:
                    throw "JZ: unsupported cc_op=" + Aa;
                }
                if (!Ha) {
                    ga = Na[Eb++] << 24 >> 24;
                    Eb = Eb + ga >> 0;
                } else {
                    Eb = Eb + 1 >> 0;
                }
                break jd;
              case 226:
                ga = Na[Eb++] << 24 >> 24;
                xa[1] = xa[1] - 1 & -1;
                if (xa[1]) Eb = Eb + ga >> 0;
                break jd;
              case 227:
                ga = Na[Eb++] << 24 >> 24;
                if (xa[1] == 0) Eb = Eb + ga >> 0;
                break jd;
              case 194:
                Ha = Hb() << 16 >> 16;
                fa = xa[4];
                ga = eb();
                xa[4] = xa[4] + 4 + Ha & -1;
                Db = ga, Eb = Gb = 0;
                break jd;
              case 195:
                fa = xa[4];
                ga = eb();
                xa[4] = xa[4] + 4 & -1;
                Db = ga, Eb = Gb = 0;
                break jd;
              case 232:
                {
                    ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                    Eb += 4;
                }
                fa = xa[4] - 4 & -1;
                qb(Db + Eb - Gb);
                xa[4] = fa;
                Eb = Eb + ga >> 0;
                break jd;
              case 144:
                break jd;
              case 204:
                Ha = Db + Eb - Gb;
                Od(3, 1, 0, Ha, 0);
                break jd;
              case 205:
                ga = Na[Eb++];
                Ha = Db + Eb - Gb;
                Od(ga, 1, 0, Ha, 0);
                break jd;
              case 206:
                if (Tb(0)) {
                    Ha = Db + Eb - Gb;
                    Od(4, 1, 0, Ha, 0);
                }
                break jd;
              case 98:
                Pe();
                break jd;
              case 207:
                Be(1);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 245:
                ya = ec() ^ 1;
                Aa = 24;
                break jd;
              case 248:
                ya = ec() & ~1;
                Aa = 24;
                break jd;
              case 249:
                ya = ec() | 1;
                Aa = 24;
                break jd;
              case 252:
                wa.df = 1;
                break jd;
              case 253:
                wa.df = -1;
                break jd;
              case 250:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                wa.eflags &= ~512;
                break jd;
              case 251:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                wa.eflags |= 512;
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 158:
                ga = xa[0] >> 8 & (128 | 64 | 16 | 4 | 1) | Tb(0) << 11;
                ya = ga;
                Aa = 24;
                break jd;
              case 159:
                ga = Pc();
                Nb(4, ga);
                break jd;
              case 244:
                if (wa.cpl != 0) rc(13);
                wa.halted = 1;
                La = 257;
                break Re;
              case 164:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        if (8 === 32 && xa[1] >>> 0 >= 4 && wa.df == 1 && ((xa[6] | xa[7]) & 3) == 0 && bd()) {} else {
                            fa = xa[6];
                            ga = ab();
                            fa = xa[7];
                            mb(ga);
                            xa[6] = xa[6] + (wa.df << 0) & -1;
                            xa[7] = xa[7] + (wa.df << 0) & -1;
                            xa[1] = xa[1] - 1 & -1;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[6];
                    ga = ab();
                    fa = xa[7];
                    mb(ga);
                    xa[6] = xa[6] + (wa.df << 0) & -1;
                    xa[7] = xa[7] + (wa.df << 0) & -1;
                }
                break jd;
              case 165:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        if (32 === 32 && xa[1] >>> 0 >= 4 && wa.df == 1 && ((xa[6] | xa[7]) & 3) == 0 && bd()) {} else {
                            fa = xa[6];
                            ga = eb();
                            fa = xa[7];
                            qb(ga);
                            xa[6] = xa[6] + (wa.df << 2) & -1;
                            xa[7] = xa[7] + (wa.df << 2) & -1;
                            xa[1] = xa[1] - 1 & -1;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[6];
                    ga = eb();
                    fa = xa[7];
                    qb(ga);
                    xa[6] = xa[6] + (wa.df << 2) & -1;
                    xa[7] = xa[7] + (wa.df << 2) & -1;
                }
                break jd;
              case 170:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        if (8 === 32 && xa[1] >>> 0 >= 4 && wa.df == 1 && (xa[7] & 3) == 0 && gd()) {} else {
                            fa = xa[7];
                            mb(xa[0]);
                            xa[7] = fa + (wa.df << 0) & -1;
                            xa[1] = xa[1] - 1 & -1;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[7];
                    mb(xa[0]);
                    xa[7] = fa + (wa.df << 0) & -1;
                }
                break jd;
              case 171:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        if (32 === 32 && xa[1] >>> 0 >= 4 && wa.df == 1 && (xa[7] & 3) == 0 && gd()) {} else {
                            fa = xa[7];
                            qb(xa[0]);
                            xa[7] = fa + (wa.df << 2) & -1;
                            xa[1] = xa[1] - 1 & -1;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[7];
                    qb(xa[0]);
                    xa[7] = fa + (wa.df << 2) & -1;
                }
                break jd;
              case 166:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        fa = xa[6];
                        ga = ab();
                        fa = xa[7];
                        Ha = ab();
                        Pb(7, ga, Ha);
                        xa[6] = xa[6] + (wa.df << 0) & -1;
                        xa[7] = xa[7] + (wa.df << 0) & -1;
                        xa[1] = xa[1] - 1 & -1;
                        if (Da & 16) {
                            if (!Tb(4)) break jd;
                        } else {
                            if (Tb(4)) break jd;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[6];
                    ga = ab();
                    fa = xa[7];
                    Ha = ab();
                    Pb(7, ga, Ha);
                    xa[6] = xa[6] + (wa.df << 0) & -1;
                    xa[7] = xa[7] + (wa.df << 0) & -1;
                }
                break jd;
              case 167:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        fa = xa[6];
                        ga = eb();
                        fa = xa[7];
                        Ha = eb();
                        Zb(7, ga, Ha);
                        xa[6] = xa[6] + (wa.df << 2) & -1;
                        xa[7] = xa[7] + (wa.df << 2) & -1;
                        xa[1] = xa[1] - 1 & -1;
                        if (Da & 16) {
                            if (!Tb(4)) break jd;
                        } else {
                            if (Tb(4)) break jd;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[6];
                    ga = eb();
                    fa = xa[7];
                    Ha = eb();
                    Zb(7, ga, Ha);
                    xa[6] = xa[6] + (wa.df << 2) & -1;
                    xa[7] = xa[7] + (wa.df << 2) & -1;
                }
                break jd;
              case 172:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        fa = xa[6];
                        if (8 == 32) xa[0] = eb(); else Nb(0, ab());
                        xa[6] = fa + (wa.df << 0) & -1;
                        xa[1] = xa[1] - 1 & -1;
                        Eb = Gb;
                    }
                } else {
                    fa = xa[6];
                    if (8 == 32) xa[0] = eb(); else Nb(0, ab());
                    xa[6] = fa + (wa.df << 0) & -1;
                }
                break jd;
              case 173:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        fa = xa[6];
                        if (32 == 32) xa[0] = eb(); else Te(0, eb());
                        xa[6] = fa + (wa.df << 2) & -1;
                        xa[1] = xa[1] - 1 & -1;
                        Eb = Gb;
                    }
                } else {
                    fa = xa[6];
                    if (32 == 32) xa[0] = eb(); else Te(0, eb());
                    xa[6] = fa + (wa.df << 2) & -1;
                }
                break jd;
              case 174:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        fa = xa[7];
                        ga = ab();
                        Pb(7, xa[0], ga);
                        xa[7] = xa[7] + (wa.df << 0) & -1;
                        xa[1] = xa[1] - 1 & -1;
                        if (Da & 16) {
                            if (!Tb(4)) break jd;
                        } else {
                            if (Tb(4)) break jd;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[7];
                    ga = ab();
                    Pb(7, xa[0], ga);
                    xa[7] = xa[7] + (wa.df << 0) & -1;
                }
                break jd;
              case 175:
                if (Da & (16 | 32)) {
                    if (xa[1]) {
                        fa = xa[7];
                        ga = eb();
                        Zb(7, xa[0], ga);
                        xa[7] = xa[7] + (wa.df << 2) & -1;
                        xa[1] = xa[1] - 1 & -1;
                        if (Da & 16) {
                            if (!Tb(4)) break jd;
                        } else {
                            if (Tb(4)) break jd;
                        }
                        Eb = Gb;
                    }
                } else {
                    fa = xa[7];
                    ga = eb();
                    Zb(7, xa[0], ga);
                    xa[7] = xa[7] + (wa.df << 2) & -1;
                }
                break jd;
              case 216:
              case 217:
              case 218:
              case 219:
              case 220:
              case 221:
              case 222:
              case 223:
                if (wa.cr0 & (1 << 2 | 1 << 3)) {
                    rc(7);
                }
                Ea = Na[Eb++];
                Ga = Ea >> 3 & 7;
                Fa = Ea & 7;
                Ja = (b & 7) << 3 | Ea >> 3 & 7;
                Ob(0, 65535);
                if (Ea >> 6 == 3) {} else {
                    fa = Ib(Ea);
                }
                break jd;
              case 155:
                break jd;
              case 228:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                ga = Na[Eb++];
                Nb(0, wa.ld8_port(ga));
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 229:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                ga = Na[Eb++];
                xa[0] = wa.ld32_port(ga);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 230:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                ga = Na[Eb++];
                wa.st8_port(ga, xa[0] & 255);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 231:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                ga = Na[Eb++];
                wa.st32_port(ga, xa[0]);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 236:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                Nb(0, wa.ld8_port(xa[2] & 65535));
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 237:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                xa[0] = wa.ld32_port(xa[2] & 65535);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 238:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                wa.st8_port(xa[2] & 65535, xa[0] & 255);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 239:
                ye = wa.eflags >> 12 & 3;
                if (wa.cpl > ye) rc(13);
                wa.st32_port(xa[2] & 65535, xa[0]);
                {
                    if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                }
                break jd;
              case 39:
                Le();
                break jd;
              case 47:
                Ne();
                break jd;
              case 55:
                He();
                break jd;
              case 63:
                Ke();
                break jd;
              case 212:
                ga = Na[Eb++];
                De(ga);
                break jd;
              case 213:
                ga = Na[Eb++];
                Ge(ga);
                break jd;
              case 38:
              case 46:
              case 54:
              case 62:
              case 99:
              case 103:
              case 108:
              case 109:
              case 110:
              case 111:
              case 130:
              case 154:
              case 200:
              case 202:
              case 203:
              case 214:
              case 224:
              case 225:
              case 241:
                rc(6);
                break;
              case 15:
                b = Na[Eb++];
                switch (b) {
                  case 128:
                  case 129:
                  case 130:
                  case 131:
                  case 132:
                  case 133:
                  case 134:
                  case 135:
                  case 136:
                  case 137:
                  case 138:
                  case 139:
                  case 140:
                  case 141:
                  case 142:
                  case 143:
                    Ha = Tb(b & 15);
                    {
                        ga = Na[Eb] | Na[Eb + 1] << 8 | Na[Eb + 2] << 16 | Na[Eb + 3] << 24;
                        Eb += 4;
                    }
                    if (Ha) Eb = Eb + ga >> 0;
                    break jd;
                  case 144:
                  case 145:
                  case 146:
                  case 147:
                  case 148:
                  case 149:
                  case 150:
                  case 151:
                  case 152:
                  case 153:
                  case 154:
                  case 155:
                  case 156:
                  case 157:
                  case 158:
                  case 159:
                    Ea = Na[Eb++];
                    ga = Tb(b & 15);
                    if (Ea >> 6 == 3) {
                        Nb(Ea & 7, ga);
                    } else {
                        fa = Ib(Ea);
                        mb(ga);
                    }
                    break jd;
                  case 64:
                  case 65:
                  case 66:
                  case 67:
                  case 68:
                  case 69:
                  case 70:
                  case 71:
                  case 72:
                  case 73:
                  case 74:
                  case 75:
                  case 76:
                  case 77:
                  case 78:
                  case 79:
                    Ea = Na[Eb++];
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = eb();
                    }
                    if (Tb(b & 15)) xa[Ea >> 3 & 7] = ga;
                    break jd;
                  case 182:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    xa[Ga] = ga;
                    break jd;
                  case 183:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = cb();
                    }
                    xa[Ga] = ga & 65535;
                    break jd;
                  case 190:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                    } else {
                        fa = Ib(Ea);
                        ga = ab();
                    }
                    xa[Ga] = ga << 24 >> 24;
                    break jd;
                  case 191:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = cb();
                    }
                    xa[Ga] = ga << 16 >> 16;
                    break jd;
                  case 0:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    switch (Ja) {
                      case 0:
                      case 1:
                        if (Ja == 0) ga = wa.ldt.selector; else ga = wa.tr.selector;
                        if (Ea >> 6 == 3) {
                            Ob(Ea & 7, ga);
                        } else {
                            fa = Ib(Ea);
                            ob(ga);
                        }
                        break;
                      case 2:
                        if (wa.cpl != 0) rc(13);
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7] & 65535;
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        de(ga);
                        break;
                      case 3:
                        if (wa.cpl != 0) rc(13);
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7] & 65535;
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        fe(ga);
                        break;
                      default:
                        rc(6);
                    }
                    break jd;
                  case 1:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    switch (Ja) {
                      case 2:
                      case 3:
                        if (Ea >> 6 == 3) rc(6);
                        if (this.cpl != 0) rc(13);
                        fa = Ib(Ea);
                        ga = cb();
                        fa += 2;
                        Ha = eb();
                        if (Ja == 2) {
                            this.gdt.base = Ha;
                            this.gdt.limit = ga;
                        } else {
                            this.idt.base = Ha;
                            this.idt.limit = ga;
                        }
                        break;
                      case 7:
                        if (this.cpl != 0) rc(13);
                        if (Ea >> 6 == 3) rc(6);
                        fa = Ib(Ea);
                        wa.tlb_flush_page(fa & -4096);
                        break;
                      default:
                        rc(6);
                    }
                    break jd;
                  case 32:
                    if (wa.cpl != 0) rc(13);
                    Ea = Na[Eb++];
                    if (Ea >> 6 != 3) rc(6);
                    Ga = Ea >> 3 & 7;
                    switch (Ga) {
                      case 0:
                        ga = wa.cr0;
                        break;
                      case 2:
                        ga = wa.cr2;
                        break;
                      case 3:
                        ga = wa.cr3;
                        break;
                      case 4:
                        ga = wa.cr4;
                        break;
                      default:
                        rc(6);
                    }
                    xa[Ea & 7] = ga;
                    break jd;
                  case 34:
                    if (wa.cpl != 0) rc(13);
                    Ea = Na[Eb++];
                    if (Ea >> 6 != 3) rc(6);
                    Ga = Ea >> 3 & 7;
                    ga = xa[Ea & 7];
                    switch (Ga) {
                      case 0:
                        td(ga);
                        break;
                      case 2:
                        wa.cr2 = ga;
                        break;
                      case 3:
                        vd(ga);
                        break;
                      case 4:
                        xd(ga);
                        break;
                      default:
                        rc(6);
                    }
                    break jd;
                  case 6:
                    if (wa.cpl != 0) rc(13);
                    td(wa.cr0 & ~(1 << 3));
                    break jd;
                  case 35:
                    if (wa.cpl != 0) rc(13);
                    Ea = Na[Eb++];
                    if (Ea >> 6 != 3) rc(6);
                    Ga = Ea >> 3 & 7;
                    ga = xa[Ea & 7];
                    if (Ga == 4 || Ga == 5) rc(6);
                    break jd;
                  case 178:
                    {
                        Ea = Na[Eb++];
                        if (Ea >> 3 == 3) rc(6);
                        fa = Ib(Ea);
                        ga = eb();
                        fa += 4;
                        Ha = cb();
                        ge(2, Ha);
                        xa[Ea >> 3 & 7] = ga;
                    }
                    break jd;
                  case 180:
                    {
                        Ea = Na[Eb++];
                        if (Ea >> 3 == 3) rc(6);
                        fa = Ib(Ea);
                        ga = eb();
                        fa += 4;
                        Ha = cb();
                        ge(4, Ha);
                        xa[Ea >> 3 & 7] = ga;
                    }
                    break jd;
                  case 181:
                    {
                        Ea = Na[Eb++];
                        if (Ea >> 3 == 3) rc(6);
                        fa = Ib(Ea);
                        ga = eb();
                        fa += 4;
                        Ha = cb();
                        ge(5, Ha);
                        xa[Ea >> 3 & 7] = ga;
                    }
                    break jd;
                  case 162:
                    Ce();
                    break jd;
                  case 164:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Ia = Na[Eb++];
                        Fa = Ea & 7;
                        xa[Fa] = hc(xa[Fa], Ha, Ia);
                    } else {
                        fa = Ib(Ea);
                        Ia = Na[Eb++];
                        ga = kb();
                        ga = hc(Ja, ga, Ha, Ia);
                        qb(ga);
                    }
                    break jd;
                  case 165:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    Ia = xa[1];
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = hc(xa[Fa], Ha, Ia);
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        ga = hc(Ja, ga, Ha, Ia);
                        qb(ga);
                    }
                    break jd;
                  case 172:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Ia = Na[Eb++];
                        Fa = Ea & 7;
                        xa[Fa] = jc(xa[Fa], Ha, Ia);
                    } else {
                        fa = Ib(Ea);
                        Ia = Na[Eb++];
                        ga = kb();
                        ga = jc(Ja, ga, Ha, Ia);
                        qb(ga);
                    }
                    break jd;
                  case 173:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    Ia = xa[1];
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = jc(xa[Fa], Ha, Ia);
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        ga = jc(Ja, ga, Ha, Ia);
                        qb(ga);
                    }
                    break jd;
                  case 186:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    switch (Ja) {
                      case 4:
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                            Ha = Na[Eb++];
                        } else {
                            fa = Ib(Ea);
                            Ha = Na[Eb++];
                            ga = kb();
                        }
                        kc(ga, Ha);
                        break;
                      case 5:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ha = Na[Eb++];
                            xa[Fa] = lc(xa[Fa], Ha);
                        } else {
                            fa = Ib(Ea);
                            Ha = Na[Eb++];
                            ga = kb();
                            ga = lc(ga, Ha);
                            qb(ga);
                        }
                        break;
                      case 6:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ha = Na[Eb++];
                            xa[Fa] = mc(xa[Fa], Ha);
                        } else {
                            fa = Ib(Ea);
                            Ha = Na[Eb++];
                            ga = kb();
                            ga = mc(ga, Ha);
                            qb(ga);
                        }
                        break;
                      case 7:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ha = Na[Eb++];
                            xa[Fa] = nc(xa[Fa], Ha);
                        } else {
                            fa = Ib(Ea);
                            Ha = Na[Eb++];
                            ga = kb();
                            ga = nc(ga, Ha);
                            qb(ga);
                        }
                        break;
                      default:
                        rc(6);
                    }
                    break jd;
                  case 163:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        fa = fa + (Ha >> 5 << 2) & -1;
                        ga = eb();
                    }
                    kc(ga, Ha);
                    break jd;
                  case 171:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = lc(xa[Fa], Ha);
                    } else {
                        fa = Ib(Ea);
                        fa = fa + (Ha >> 5 << 2) & -1;
                        ga = kb();
                        ga = lc(ga, Ha);
                        qb(ga);
                    }
                    break jd;
                  case 179:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = mc(xa[Fa], Ha);
                    } else {
                        fa = Ib(Ea);
                        fa = fa + (Ha >> 5 << 2) & -1;
                        ga = kb();
                        ga = mc(ga, Ha);
                        qb(ga);
                    }
                    break jd;
                  case 187:
                    Ea = Na[Eb++];
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        xa[Fa] = nc(xa[Fa], Ha);
                    } else {
                        fa = Ib(Ea);
                        fa = fa + (Ha >> 5 << 2) & -1;
                        ga = kb();
                        ga = nc(ga, Ha);
                        qb(ga);
                    }
                    break jd;
                  case 188:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        Ha = eb();
                    }
                    xa[Ga] = oc(xa[Ga], Ha);
                    break jd;
                  case 189:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        Ha = eb();
                    }
                    xa[Ga] = pc(xa[Ga], Ha);
                    break jd;
                  case 175:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        Ha = eb();
                    }
                    xa[Ga] = Kc(xa[Ga], Ha);
                    break jd;
                  case 49:
                    if (wa.cr4 & 1 << 2 && wa.cpl != 0) rc(13);
                    ga = Tc();
                    xa[0] = ga >>> 0;
                    xa[2] = ga / 4294967296 >>> 0;
                    break jd;
                  case 192:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                        Ha = Pb(0, ga, xa[Ga & 3] >> ((Ga & 4) << 1) & 255);
                        Nb(Ga, ga);
                        Nb(Fa, Ha);
                    } else {
                        fa = Ib(Ea);
                        ga = gb();
                        Ha = Pb(0, ga, xa[Ga & 3] >> ((Ga & 4) << 1) & 255);
                        mb(Ha);
                        Nb(Ga, ga);
                    }
                    break jd;
                  case 193:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa];
                        Ha = Zb(0, ga, xa[Ga]);
                        xa[Ga] = ga;
                        xa[Fa] = Ha;
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        Ha = Zb(0, ga, xa[Ga]);
                        qb(Ha);
                        xa[Ga] = ga;
                    }
                    break jd;
                  case 177:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa];
                        Ha = Zb(5, xa[0], ga);
                        if (Ha == 0) {
                            xa[Fa] = xa[Ga];
                        } else {
                            xa[0] = ga;
                        }
                    } else {
                        fa = Ib(Ea);
                        ga = kb();
                        Ha = Zb(5, xa[0], ga);
                        if (Ha == 0) {
                            qb(xa[Ga]);
                        } else {
                            xa[0] = ga;
                        }
                    }
                    break jd;
                  case 160:
                    {
                        ga = wa.segs[4].selector;
                        fa = xa[4] - 4 & -1;
                        qb(ga);
                        xa[4] = fa;
                    }
                    break jd;
                  case 168:
                    {
                        ga = wa.segs[5].selector;
                        fa = xa[4] - 4 & -1;
                        qb(ga);
                        xa[4] = fa;
                    }
                    break jd;
                  case 161:
                    {
                        fa = xa[4];
                        ga = eb();
                        ge(4, ga & 65535);
                        xa[4] = xa[4] + 4 & -1;
                    }
                    break jd;
                  case 169:
                    {
                        fa = xa[4];
                        ga = eb();
                        ge(5, ga & 65535);
                        xa[4] = xa[4] + 4 & -1;
                    }
                    break jd;
                  case 200:
                  case 201:
                  case 202:
                  case 203:
                  case 204:
                  case 205:
                  case 206:
                  case 207:
                    Ga = b & 7;
                    ga = xa[Ga];
                    ga = ga >>> 24 | ga >> 8 & 65280 | ga << 8 & 16711680 | ga << 24;
                    xa[Ga] = ga;
                    break jd;
                  case 2:
                  case 3:
                  case 4:
                  case 5:
                  case 7:
                  case 8:
                  case 9:
                  case 10:
                  case 11:
                  case 12:
                  case 13:
                  case 14:
                  case 15:
                  case 16:
                  case 17:
                  case 18:
                  case 19:
                  case 20:
                  case 21:
                  case 22:
                  case 23:
                  case 24:
                  case 25:
                  case 26:
                  case 27:
                  case 28:
                  case 29:
                  case 30:
                  case 31:
                  case 33:
                  case 36:
                  case 37:
                  case 38:
                  case 39:
                  case 40:
                  case 41:
                  case 42:
                  case 43:
                  case 44:
                  case 45:
                  case 46:
                  case 47:
                  case 48:
                  case 50:
                  case 51:
                  case 52:
                  case 53:
                  case 54:
                  case 55:
                  case 56:
                  case 57:
                  case 58:
                  case 59:
                  case 60:
                  case 61:
                  case 62:
                  case 63:
                  case 80:
                  case 81:
                  case 82:
                  case 83:
                  case 84:
                  case 85:
                  case 86:
                  case 87:
                  case 88:
                  case 89:
                  case 90:
                  case 91:
                  case 92:
                  case 93:
                  case 94:
                  case 95:
                  case 96:
                  case 97:
                  case 98:
                  case 99:
                  case 100:
                  case 101:
                  case 102:
                  case 103:
                  case 104:
                  case 105:
                  case 106:
                  case 107:
                  case 108:
                  case 109:
                  case 110:
                  case 111:
                  case 112:
                  case 113:
                  case 114:
                  case 115:
                  case 116:
                  case 117:
                  case 118:
                  case 119:
                  case 120:
                  case 121:
                  case 122:
                  case 123:
                  case 124:
                  case 125:
                  case 126:
                  case 127:
                  case 166:
                  case 167:
                  case 170:
                  case 174:
                  case 176:
                  case 184:
                  case 185:
                  case 194:
                  case 195:
                  case 196:
                  case 197:
                  case 198:
                  case 199:
                  case 208:
                  case 209:
                  case 210:
                  case 211:
                  case 212:
                  case 213:
                  case 214:
                  case 215:
                  case 216:
                  case 217:
                  case 218:
                  case 219:
                  case 220:
                  case 221:
                  case 222:
                  case 223:
                  case 224:
                  case 225:
                  case 226:
                  case 227:
                  case 228:
                  case 229:
                  case 230:
                  case 231:
                  case 232:
                  case 233:
                  case 234:
                  case 235:
                  case 236:
                  case 237:
                  case 238:
                  case 239:
                  case 240:
                  case 241:
                  case 242:
                  case 243:
                  case 244:
                  case 245:
                  case 246:
                  case 247:
                  case 248:
                  case 249:
                  case 250:
                  case 251:
                  case 252:
                  case 253:
                  case 254:
                  case 255:
                  default:
                    rc(6);
                }
                break;
              default:
                switch (b) {
                  case 358:
                    Da |= 256;
                    b = Na[Eb++];
                    b |= Da & 256;
                    break;
                  case 496:
                    Da |= 64;
                    b = Na[Eb++];
                    b |= Da & 256;
                    break;
                  case 498:
                    Da |= 32;
                    b = Na[Eb++];
                    b |= Da & 256;
                    break;
                  case 499:
                    Da |= 16;
                    b = Na[Eb++];
                    b |= Da & 256;
                    break;
                  case 356:
                    if (Da == 0) hd(Db, b);
                    Da = Da & ~15 | 4 + 1;
                    b = Na[Eb++];
                    b |= Da & 256;
                    break;
                  case 357:
                    if (Da == 0) hd(Db, b);
                    Da = Da & ~15 | 5 + 1;
                    b = Na[Eb++];
                    b |= Da & 256;
                    break;
                  case 393:
                    Ea = Na[Eb++];
                    ga = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Ob(Ea & 7, ga);
                    } else {
                        fa = Ib(Ea);
                        ob(ga);
                    }
                    break jd;
                  case 395:
                    Ea = Na[Eb++];
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = cb();
                    }
                    Ob(Ea >> 3 & 7, ga);
                    break jd;
                  case 440:
                  case 441:
                  case 442:
                  case 443:
                  case 444:
                  case 445:
                  case 446:
                  case 447:
                    Ob(b & 7, Hb());
                    break jd;
                  case 417:
                    fa = Mb();
                    ga = cb();
                    Ob(0, ga);
                    break jd;
                  case 419:
                    fa = Mb();
                    ob(xa[0]);
                    break jd;
                  case 455:
                    Ea = Na[Eb++];
                    if (Ea >> 6 == 3) {
                        ga = Hb();
                        Ob(Ea & 7, ga);
                    } else {
                        fa = Ib(Ea);
                        ga = Hb();
                        ob(ga);
                    }
                    break jd;
                  case 401:
                  case 402:
                  case 403:
                  case 404:
                  case 405:
                  case 406:
                  case 407:
                    Ga = b & 7;
                    ga = xa[0];
                    Ob(0, xa[Ga]);
                    Ob(Ga, ga);
                    break jd;
                  case 391:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        ga = xa[Fa];
                        Ob(Fa, xa[Ga]);
                    } else {
                        fa = Ib(Ea);
                        ga = ib();
                        ob(xa[Ga]);
                    }
                    Ob(Ga, ga);
                    break jd;
                  case 257:
                  case 265:
                  case 273:
                  case 281:
                  case 289:
                  case 297:
                  case 305:
                  case 313:
                    Ea = Na[Eb++];
                    Ja = b >> 3 & 7;
                    Ha = xa[Ea >> 3 & 7];
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Ob(Fa, Wb(Ja, xa[Fa], Ha));
                    } else {
                        fa = Ib(Ea);
                        if (Ja != 7) {
                            ga = ib();
                            ga = Wb(Ja, ga, Ha);
                            ob(ga);
                        } else {
                            ga = cb();
                            Wb(7, ga, Ha);
                        }
                    }
                    break jd;
                  case 259:
                  case 267:
                  case 275:
                  case 283:
                  case 291:
                  case 299:
                  case 307:
                  case 315:
                    Ea = Na[Eb++];
                    Ja = b >> 3 & 7;
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        Ha = cb();
                    }
                    Ob(Ga, Wb(Ja, xa[Ga], Ha));
                    break jd;
                  case 261:
                  case 269:
                  case 277:
                  case 285:
                  case 293:
                  case 301:
                  case 309:
                  case 317:
                    Ha = Hb();
                    Ja = b >> 3 & 7;
                    Ob(0, Wb(Ja, xa[0], Ha));
                    break jd;
                  case 385:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Ha = Hb();
                        xa[Fa] = Wb(Ja, xa[Fa], Ha);
                    } else {
                        fa = Ib(Ea);
                        Ha = Hb();
                        if (Ja != 7) {
                            ga = ib();
                            ga = Wb(Ja, ga, Ha);
                            ob(ga);
                        } else {
                            ga = cb();
                            Wb(7, ga, Ha);
                        }
                    }
                    break jd;
                  case 387:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Ha = Na[Eb++] << 24 >> 24;
                        Ob(Fa, Wb(Ja, xa[Fa], Ha));
                    } else {
                        fa = Ib(Ea);
                        Ha = Na[Eb++] << 24 >> 24;
                        if (Ja != 7) {
                            ga = ib();
                            ga = Wb(Ja, ga, Ha);
                            ob(ga);
                        } else {
                            ga = cb();
                            Wb(7, ga, Ha);
                        }
                    }
                    break jd;
                  case 320:
                  case 321:
                  case 322:
                  case 323:
                  case 324:
                  case 325:
                  case 326:
                  case 327:
                    Ga = b & 7;
                    Ob(Ga, Xb(xa[Ga]));
                    break jd;
                  case 328:
                  case 329:
                  case 330:
                  case 331:
                  case 332:
                  case 333:
                  case 334:
                  case 335:
                    Ga = b & 7;
                    Ob(Ga, Yb(xa[Ga]));
                    break jd;
                  case 363:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        Ha = cb();
                    }
                    Ia = Na[Eb++] << 24 >> 24;
                    Ob(Ga, Fc(Ha, Ia));
                    break jd;
                  case 361:
                    Ea = Na[Eb++];
                    Ga = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        Ha = cb();
                    }
                    Ia = Hb();
                    Ob(Ga, Fc(Ha, Ia));
                    break jd;
                  case 389:
                    Ea = Na[Eb++];
                    if (Ea >> 6 == 3) {
                        ga = xa[Ea & 7];
                    } else {
                        fa = Ib(Ea);
                        ga = cb();
                    }
                    Ha = xa[Ea >> 3 & 7];
                    za = ga & Ha;
                    Aa = 13;
                    break jd;
                  case 425:
                    Ha = Hb();
                    za = xa[0] & Ha;
                    Aa = 13;
                    break jd;
                  case 503:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    switch (Ja) {
                      case 0:
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        Ha = Hb();
                        za = ga & Ha;
                        Aa = 13;
                        break;
                      case 2:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ob(Fa, ~xa[Fa]);
                        } else {
                            fa = Ib(Ea);
                            ga = ib();
                            ga = ~ga;
                            ob(ga);
                        }
                        break;
                      case 3:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ob(Fa, Wb(5, 0, xa[Fa]));
                        } else {
                            fa = Ib(Ea);
                            ga = ib();
                            ga = Wb(5, 0, ga);
                            ob(ga);
                        }
                        break;
                      case 4:
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        ga = Ec(xa[0], ga);
                        Ob(0, ga);
                        Ob(2, ga >> 16);
                        break;
                      case 5:
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        ga = Fc(xa[0], ga);
                        Ob(0, ga);
                        Ob(2, ga >> 16);
                        break;
                      case 6:
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        tc(ga);
                        break;
                      case 7:
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        uc(ga);
                        break;
                      default:
                        rc(6);
                    }
                    break jd;
                  case 449:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Ha = Na[Eb++];
                        Fa = Ea & 7;
                        Ob(Fa, fc(Ja, xa[Fa], Ha));
                    } else {
                        fa = Ib(Ea);
                        Ha = Na[Eb++];
                        ga = ib();
                        ga = fc(Ja, ga, Ha);
                        ob(ga);
                    }
                    break jd;
                  case 465:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Ob(Fa, fc(Ja, xa[Fa], 1));
                    } else {
                        fa = Ib(Ea);
                        ga = ib();
                        ga = fc(Ja, ga, 1);
                        ob(ga);
                    }
                    break jd;
                  case 467:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    Ha = xa[1] & 255;
                    if (Ea >> 6 == 3) {
                        Fa = Ea & 7;
                        Ob(Fa, fc(Ja, xa[Fa], Ha));
                    } else {
                        fa = Ib(Ea);
                        ga = ib();
                        ga = fc(Ja, ga, Ha);
                        ob(ga);
                    }
                    break jd;
                  case 408:
                    Ob(0, xa[0] << 24 >> 24);
                    break jd;
                  case 409:
                    Ob(2, xa[0] << 16 >> 31);
                    break jd;
                  case 511:
                    Ea = Na[Eb++];
                    Ja = Ea >> 3 & 7;
                    switch (Ja) {
                      case 0:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ob(Fa, Xb(xa[Fa]));
                        } else {
                            fa = Ib(Ea);
                            ga = ib();
                            ga = Xb(ga);
                            ob(ga);
                        }
                        break;
                      case 1:
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            Ob(Fa, Yb(xa[Fa]));
                        } else {
                            fa = Ib(Ea);
                            ga = ib();
                            ga = Yb(ga);
                            ob(ga);
                        }
                        break;
                      case 2:
                      case 4:
                      case 6:
                      case 3:
                      case 5:
                      default:
                        throw "GRP5";
                    }
                    break jd;
                  case 400:
                    break jd;
                  case 421:
                    if (Da & (16 | 32)) {
                        if (xa[1]) {
                            if (16 === 32 && xa[1] >>> 0 >= 4 && wa.df == 1 && ((xa[6] | xa[7]) & 3) == 0 && bd()) {} else {
                                fa = xa[6];
                                ga = cb();
                                fa = xa[7];
                                ob(ga);
                                xa[6] = xa[6] + (wa.df << 1) & -1;
                                xa[7] = xa[7] + (wa.df << 1) & -1;
                                xa[1] = xa[1] - 1 & -1;
                            }
                            Eb = Gb;
                        }
                    } else {
                        fa = xa[6];
                        ga = cb();
                        fa = xa[7];
                        ob(ga);
                        xa[6] = xa[6] + (wa.df << 1) & -1;
                        xa[7] = xa[7] + (wa.df << 1) & -1;
                    }
                    break jd;
                  case 423:
                    if (Da & (16 | 32)) {
                        if (xa[1]) {
                            fa = xa[6];
                            ga = cb();
                            fa = xa[7];
                            Ha = cb();
                            Wb(7, ga, Ha);
                            xa[6] = xa[6] + (wa.df << 1) & -1;
                            xa[7] = xa[7] + (wa.df << 1) & -1;
                            xa[1] = xa[1] - 1 & -1;
                            if (Da & 16) {
                                if (!Tb(4)) break jd;
                            } else {
                                if (Tb(4)) break jd;
                            }
                            Eb = Gb;
                        }
                    } else {
                        fa = xa[6];
                        ga = cb();
                        fa = xa[7];
                        Ha = cb();
                        Wb(7, ga, Ha);
                        xa[6] = xa[6] + (wa.df << 1) & -1;
                        xa[7] = xa[7] + (wa.df << 1) & -1;
                    }
                    break jd;
                  case 429:
                    if (Da & (16 | 32)) {
                        if (xa[1]) {
                            fa = xa[6];
                            if (16 == 32) xa[0] = eb(); else Ob(0, cb());
                            xa[6] = fa + (wa.df << 1) & -1;
                            xa[1] = xa[1] - 1 & -1;
                            Eb = Gb;
                        }
                    } else {
                        fa = xa[6];
                        if (16 == 32) xa[0] = eb(); else Ob(0, cb());
                        xa[6] = fa + (wa.df << 1) & -1;
                    }
                    break jd;
                  case 431:
                    if (Da & (16 | 32)) {
                        if (xa[1]) {
                            fa = xa[7];
                            ga = cb();
                            Wb(7, xa[0], ga);
                            xa[7] = xa[7] + (wa.df << 1) & -1;
                            xa[1] = xa[1] - 1 & -1;
                            if (Da & 16) {
                                if (!Tb(4)) break jd;
                            } else {
                                if (Tb(4)) break jd;
                            }
                            Eb = Gb;
                        }
                    } else {
                        fa = xa[7];
                        ga = cb();
                        Wb(7, xa[0], ga);
                        xa[7] = xa[7] + (wa.df << 1) & -1;
                    }
                    break jd;
                  case 427:
                    if (Da & (16 | 32)) {
                        if (xa[1]) {
                            if (16 === 32 && xa[1] >>> 0 >= 4 && wa.df == 1 && (xa[7] & 3) == 0 && gd()) {} else {
                                fa = xa[7];
                                ob(xa[0]);
                                xa[7] = fa + (wa.df << 1) & -1;
                                xa[1] = xa[1] - 1 & -1;
                            }
                            Eb = Gb;
                        }
                    } else {
                        fa = xa[7];
                        ob(xa[0]);
                        xa[7] = fa + (wa.df << 1) & -1;
                    }
                    break jd;
                  case 472:
                  case 473:
                  case 474:
                  case 475:
                  case 476:
                  case 477:
                  case 478:
                  case 479:
                    b &= 255;
                    break;
                  case 485:
                    ye = wa.eflags >> 12 & 3;
                    if (wa.cpl > ye) rc(13);
                    ga = Na[Eb++];
                    Ob(0, wa.ld16_port(ga));
                    {
                        if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                    }
                    break jd;
                  case 487:
                    ye = wa.eflags >> 12 & 3;
                    if (wa.cpl > ye) rc(13);
                    ga = Na[Eb++];
                    wa.st16_port(ga, xa[0] & 65535);
                    {
                        if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                    }
                    break jd;
                  case 493:
                    ye = wa.eflags >> 12 & 3;
                    if (wa.cpl > ye) rc(13);
                    Ob(0, wa.ld16_port(xa[2] & 65535));
                    {
                        if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                    }
                    break jd;
                  case 495:
                    ye = wa.eflags >> 12 & 3;
                    if (wa.cpl > ye) rc(13);
                    wa.st16_port(xa[2] & 65535, xa[0] & 65535);
                    {
                        if (wa.hard_irq != 0 && wa.eflags & 512) break Re;
                    }
                    break jd;
                  case 354:
                    Qe();
                    break jd;
                  case 256:
                  case 258:
                  case 260:
                  case 262:
                  case 263:
                  case 264:
                  case 266:
                  case 268:
                  case 270:
                  case 272:
                  case 274:
                  case 276:
                  case 278:
                  case 279:
                  case 280:
                  case 282:
                  case 284:
                  case 286:
                  case 287:
                  case 288:
                  case 290:
                  case 292:
                  case 294:
                  case 295:
                  case 296:
                  case 298:
                  case 300:
                  case 302:
                  case 303:
                  case 304:
                  case 306:
                  case 308:
                  case 310:
                  case 311:
                  case 312:
                  case 314:
                  case 316:
                  case 318:
                  case 319:
                  case 336:
                  case 337:
                  case 338:
                  case 339:
                  case 340:
                  case 341:
                  case 342:
                  case 343:
                  case 344:
                  case 345:
                  case 346:
                  case 347:
                  case 348:
                  case 349:
                  case 350:
                  case 351:
                  case 352:
                  case 353:
                  case 355:
                  case 359:
                  case 360:
                  case 362:
                  case 364:
                  case 365:
                  case 366:
                  case 367:
                  case 368:
                  case 369:
                  case 370:
                  case 371:
                  case 372:
                  case 373:
                  case 374:
                  case 375:
                  case 376:
                  case 377:
                  case 378:
                  case 379:
                  case 380:
                  case 381:
                  case 382:
                  case 383:
                  case 384:
                  case 386:
                  case 388:
                  case 390:
                  case 392:
                  case 394:
                  case 396:
                  case 397:
                  case 398:
                  case 399:
                  case 410:
                  case 411:
                  case 412:
                  case 413:
                  case 414:
                  case 415:
                  case 416:
                  case 418:
                  case 420:
                  case 422:
                  case 424:
                  case 426:
                  case 428:
                  case 430:
                  case 432:
                  case 433:
                  case 434:
                  case 435:
                  case 436:
                  case 437:
                  case 438:
                  case 439:
                  case 448:
                  case 450:
                  case 451:
                  case 452:
                  case 453:
                  case 454:
                  case 456:
                  case 457:
                  case 458:
                  case 459:
                  case 460:
                  case 461:
                  case 462:
                  case 463:
                  case 464:
                  case 466:
                  case 468:
                  case 469:
                  case 470:
                  case 471:
                  case 480:
                  case 481:
                  case 482:
                  case 483:
                  case 484:
                  case 486:
                  case 488:
                  case 489:
                  case 490:
                  case 491:
                  case 492:
                  case 494:
                  case 497:
                  case 500:
                  case 501:
                  case 502:
                  case 504:
                  case 505:
                  case 506:
                  case 507:
                  case 508:
                  case 509:
                  case 510:
                  default:
                    rc(6);
                  case 271:
                    b = Na[Eb++];
                    b |= 256;
                    switch (b) {
                      case 320:
                      case 321:
                      case 322:
                      case 323:
                      case 324:
                      case 325:
                      case 326:
                      case 327:
                      case 328:
                      case 329:
                      case 330:
                      case 331:
                      case 332:
                      case 333:
                      case 334:
                      case 335:
                        Ea = Na[Eb++];
                        if (Ea >> 6 == 3) {
                            ga = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            ga = cb();
                        }
                        if (Tb(b & 15)) Ob(Ea >> 3 & 7, ga);
                        break jd;
                      case 438:
                        Ea = Na[Eb++];
                        Ga = Ea >> 3 & 7;
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                        } else {
                            fa = Ib(Ea);
                            ga = ab();
                        }
                        Ob(Ga, ga);
                        break jd;
                      case 446:
                        Ea = Na[Eb++];
                        Ga = Ea >> 3 & 7;
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            ga = xa[Fa & 3] >> ((Fa & 4) << 1) & 255;
                        } else {
                            fa = Ib(Ea);
                            ga = ab();
                        }
                        Ob(Ga, ga << 24 >> 24);
                        break jd;
                      case 431:
                        Ea = Na[Eb++];
                        Ga = Ea >> 3 & 7;
                        if (Ea >> 6 == 3) {
                            Ha = xa[Ea & 7];
                        } else {
                            fa = Ib(Ea);
                            Ha = cb();
                        }
                        Ob(Ga, Fc(xa[Ga], Ha));
                        break jd;
                      case 449:
                        Ea = Na[Eb++];
                        Ga = Ea >> 3 & 7;
                        if (Ea >> 6 == 3) {
                            Fa = Ea & 7;
                            ga = xa[Fa];
                            Ha = Wb(0, ga, xa[Ga]);
                            Ob(Ga, ga);
                            Ob(Fa, Ha);
                        } else {
                            fa = Ib(Ea);
                            ga = ib();
                            Ha = Wb(0, ga, xa[Ga]);
                            ob(Ha);
                            Ob(Ga, ga);
                        }
                        break jd;
                      case 256:
                      case 257:
                      case 258:
                      case 259:
                      case 260:
                      case 261:
                      case 262:
                      case 263:
                      case 264:
                      case 265:
                      case 266:
                      case 267:
                      case 268:
                      case 269:
                      case 270:
                      case 271:
                      case 272:
                      case 273:
                      case 274:
                      case 275:
                      case 276:
                      case 277:
                      case 278:
                      case 279:
                      case 280:
                      case 281:
                      case 282:
                      case 283:
                      case 284:
                      case 285:
                      case 286:
                      case 287:
                      case 288:
                      case 289:
                      case 290:
                      case 291:
                      case 292:
                      case 293:
                      case 294:
                      case 295:
                      case 296:
                      case 297:
                      case 298:
                      case 299:
                      case 300:
                      case 301:
                      case 302:
                      case 303:
                      case 304:
                      case 305:
                      case 306:
                      case 307:
                      case 308:
                      case 309:
                      case 310:
                      case 311:
                      case 312:
                      case 313:
                      case 314:
                      case 315:
                      case 316:
                      case 317:
                      case 318:
                      case 319:
                      case 336:
                      case 337:
                      case 338:
                      case 339:
                      case 340:
                      case 341:
                      case 342:
                      case 343:
                      case 344:
                      case 345:
                      case 346:
                      case 347:
                      case 348:
                      case 349:
                      case 350:
                      case 351:
                      case 352:
                      case 353:
                      case 354:
                      case 355:
                      case 356:
                      case 357:
                      case 358:
                      case 359:
                      case 360:
                      case 361:
                      case 362:
                      case 363:
                      case 364:
                      case 365:
                      case 366:
                      case 367:
                      case 368:
                      case 369:
                      case 370:
                      case 371:
                      case 372:
                      case 373:
                      case 374:
                      case 375:
                      case 376:
                      case 377:
                      case 378:
                      case 379:
                      case 380:
                      case 381:
                      case 382:
                      case 383:
                      case 384:
                      case 385:
                      case 386:
                      case 387:
                      case 388:
                      case 389:
                      case 390:
                      case 391:
                      case 392:
                      case 393:
                      case 394:
                      case 395:
                      case 396:
                      case 397:
                      case 398:
                      case 399:
                      case 400:
                      case 401:
                      case 402:
                      case 403:
                      case 404:
                      case 405:
                      case 406:
                      case 407:
                      case 408:
                      case 409:
                      case 410:
                      case 411:
                      case 412:
                      case 413:
                      case 414:
                      case 415:
                      case 416:
                      case 417:
                      case 418:
                      case 419:
                      case 420:
                      case 421:
                      case 422:
                      case 423:
                      case 424:
                      case 425:
                      case 426:
                      case 427:
                      case 428:
                      case 429:
                      case 430:
                      case 432:
                      case 433:
                      case 434:
                      case 435:
                      case 436:
                      case 437:
                      case 439:
                      case 440:
                      case 441:
                      case 442:
                      case 443:
                      case 444:
                      case 445:
                      case 447:
                      case 448:
                      default:
                        rc(6);
                    }
                    break;
                }
            }
        }
    } while (--Ka);
    this.cycle_count += ua - Ka;
    this.eip = Db + Eb - Gb;
    this.cc_src = ya;
    this.cc_dst = za;
    this.cc_op = Aa;
    this.cc_op2 = Ba;
    this.cc_dst2 = Ca;
    return La;
};

CPU_X86.prototype.exec = function(ua) {
    var Ue, La, Ve, va;
    Ve = this.cycle_count + ua;
    La = 256;
    va = null;
    while (this.cycle_count < Ve) {
        try {
            La = this.exec_internal(Ve - this.cycle_count, va);
            if (La != 256) break;
            va = null;
        } catch (We) {
            if (We.hasOwnProperty("intno")) {
                va = We;
            } else {
                throw We;
            }
        }
    }
    return La;
};

CPU_X86.prototype.load_binary_ie9 = function(Xe, fa) {
    var Ye, Ze, cd, i;
    Ye = new XMLHttpRequest;
    Ye.open("GET", Xe, false);
    Ye.send(null);
    if (Ye.status != 200 && Ye.status != 0) {
        throw "Error while loading " + Xe;
    }
    Ze = (new VBArray(Ye.responseBody)).toArray();
    cd = Ze.length;
    for (i = 0; i < cd; i++) {
        this.st8_phys(fa + i, Ze[i]);
    }
    return cd;
};

CPU_X86.prototype.load_binary = function(Xe, fa) {
    var Ye, Ze, cd, i, af, bf;
    if (typeof ActiveXObject == "function") return this.load_binary_ie9(Xe, fa);
    Ye = new XMLHttpRequest;
    Ye.open("GET", Xe, false);
    if ("mozResponseType" in Ye) {
        Ye.mozResponseType = "arraybuffer";
    } else if ("responseType" in Ye) {
        Ye.responseType = "arraybuffer";
    } else {
        Ye.overrideMimeType("text/plain; charset=x-user-defined");
    }
    Ye.send(null);
    if (Ye.status != 200 && Ye.status != 0) {
        throw "Error while loading " + Xe;
    }
    bf = true;
    if ("mozResponse" in Ye) {
        Ze = Ye.mozResponse;
    } else if (Ye.mozResponseArrayBuffer) {
        Ze = Ye.mozResponseArrayBuffer;
    } else if ("responseType" in Ye) {
        Ze = Ye.response;
    } else {
        Ze = Ye.responseText;
        bf = false;
    }
    if (bf) {
        cd = Ze.byteLength;
        af = new Uint8Array(Ze, 0, cd);
        for (i = 0; i < cd; i++) {
            this.st8_phys(fa + i, af[i]);
        }
    } else {
        cd = Ze.length;
        for (i = 0; i < cd; i++) {
            this.st8_phys(fa + i, Ze.charCodeAt(i));
        }
    }
    return cd;
};

function cf(a) {
    return a / 10 << 4 | a % 10;
}

function df(ef) {
    var ff, d;
    ff = new Uint8Array(128);
    this.cmos_data = ff;
    this.cmos_index = 0;
    d = new Date;
    ff[0] = cf(d.getUTCSeconds());
    ff[2] = cf(d.getUTCMinutes());
    ff[4] = cf(d.getUTCHours());
    ff[6] = cf(d.getUTCDay());
    ff[7] = cf(d.getUTCDate());
    ff[8] = cf(d.getUTCMonth() + 1);
    ff[9] = cf(d.getUTCFullYear() % 100);
    ff[10] = 38;
    ff[11] = 2;
    ff[12] = 0;
    ff[13] = 128;
    ff[20] = 2;
    ef.register_ioport_write(112, 2, 1, this.ioport_write.bind(this));
    ef.register_ioport_read(112, 2, 1, this.ioport_read.bind(this));
}

df.prototype.ioport_write = function(fa, Ze) {
    if (fa == 112) {
        this.cmos_index = Ze & 127;
    }
};

df.prototype.ioport_read = function(fa) {
    var gf;
    if (fa == 112) {
        return 255;
    } else {
        gf = this.cmos_data[this.cmos_index];
        if (this.cmos_index == 10) this.cmos_data[10] ^= 128; else if (this.cmos_index == 12) this.cmos_data[12] = 0;
        return gf;
    }
};

function hf(ef, jf) {
    ef.register_ioport_write(jf, 2, 1, this.ioport_write.bind(this));
    ef.register_ioport_read(jf, 2, 1, this.ioport_read.bind(this));
    this.reset();
}

hf.prototype.reset = function() {
    this.last_irr = 0;
    this.irr = 0;
    this.imr = 0;
    this.isr = 0;
    this.priority_add = 0;
    this.irq_base = 0;
    this.read_reg_select = 0;
    this.special_mask = 0;
    this.init_state = 0;
    this.auto_eoi = 0;
    this.rotate_on_autoeoi = 0;
    this.init4 = 0;
    this.elcr = 0;
    this.elcr_mask = 0;
};

hf.prototype.set_irq1 = function(kf, lf) {
    var mf;
    mf = 1 << kf;
    if (lf) {
        if ((this.last_irr & mf) == 0) this.irr |= mf;
        this.last_irr |= mf;
    } else {
        this.last_irr &= ~mf;
    }
};

hf.prototype.get_priority = function(mf) {
    var nf;
    if (mf == 0) return -1;
    nf = 7;
    while ((mf & 1 << (nf + this.priority_add & 7)) == 0) nf--;
    return nf;
};

hf.prototype.get_irq = function() {
    var mf, of, nf;
    mf = this.irr & ~this.imr;
    nf = this.get_priority(mf);
    if (nf < 0) return -1;
    of = this.get_priority(this.isr);
    if (nf > of) {
        return nf;
    } else {
        return -1;
    }
};

hf.prototype.intack = function(kf) {
    if (this.auto_eoi) {
        if (this.rotate_on_auto_eoi) this.priority_add = kf + 1 & 7;
    } else {
        this.isr |= 1 << kf;
    }
    if (!(this.elcr & 1 << kf)) this.irr &= ~(1 << kf);
};

hf.prototype.ioport_write = function(fa, ga) {
    var nf;
    fa &= 1;
    if (fa == 0) {
        if (ga & 16) {
            this.reset();
            this.init_state = 1;
            this.init4 = ga & 1;
            if (ga & 2) throw "single mode not supported";
            if (ga & 8) throw "level sensitive irq not supported";
        } else if (ga & 8) {
            if (ga & 2) this.read_reg_select = ga & 1;
            if (ga & 64) this.special_mask = ga >> 5 & 1;
        } else {
            switch (ga) {
              case 0:
              case 128:
                this.rotate_on_autoeoi = ga >> 7;
                break;
              case 32:
              case 160:
                nf = this.get_priority(this.isr);
                if (nf >= 0) {
                    this.isr &= ~(1 << (nf + this.priority_add & 7));
                }
                if (ga == 160) this.priority_add = this.priority_add + 1 & 7;
                break;
              case 96:
              case 97:
              case 98:
              case 99:
              case 100:
              case 101:
              case 102:
              case 103:
                nf = ga & 7;
                this.isr &= ~(1 << nf);
                break;
              case 192:
              case 193:
              case 194:
              case 195:
              case 196:
              case 197:
              case 198:
              case 199:
                this.priority_add = ga + 1 & 7;
                break;
              case 224:
              case 225:
              case 226:
              case 227:
              case 228:
              case 229:
              case 230:
              case 231:
                nf = ga & 7;
                this.isr &= ~(1 << nf);
                this.priority_add = nf + 1 & 7;
                break;
            }
        }
    } else {
        switch (this.init_state) {
          case 0:
            this.imr = ga;
            this.update_irq();
            break;
          case 1:
            this.irq_base = ga & 248;
            this.init_state = 2;
            break;
          case 2:
            if (this.init4) {
                this.init_state = 3;
            } else {
                this.init_state = 0;
            }
            break;
          case 3:
            this.auto_eoi = ga >> 1 & 1;
            this.init_state = 0;
            break;
        }
    }
};

hf.prototype.ioport_read = function(pf) {
    var fa, gf;
    fa = pf & 1;
    if (fa == 0) {
        if (this.read_reg_select) gf = this.isr; else gf = this.irr;
    } else {
        gf = this.imr;
    }
    return gf;
};

function qf(ef, rf, pf, sf) {
    this.pics = new Array;
    this.pics[0] = new hf(ef, rf);
    this.pics[1] = new hf(ef, pf);
    this.pics[0].elcr_mask = 248;
    this.pics[1].elcr_mask = 222;
    this.irq_requested = 0;
    this.cpu_set_irq = sf;
    this.pics[0].update_irq = this.update_irq.bind(this);
    this.pics[1].update_irq = this.update_irq.bind(this);
}

qf.prototype.update_irq = function() {
    var tf, kf;
    tf = this.pics[1].get_irq();
    if (tf >= 0) {
        this.pics[0].set_irq1(2, 1);
        this.pics[0].set_irq1(2, 0);
    }
    kf = this.pics[0].get_irq();
    if (kf >= 0) {
        this.cpu_set_irq(1);
    } else {
        this.cpu_set_irq(0);
    }
};

qf.prototype.set_irq = function(kf, lf) {
    this.pics[kf >> 3].set_irq1(kf & 7, lf);
    this.update_irq();
};

qf.prototype.get_hard_intno = function() {
    var kf, tf, intno;
    kf = this.pics[0].get_irq();
    if (kf >= 0) {
        this.pics[0].intack(kf);
        if (kf == 2) {
            tf = this.pics[1].get_irq();
            if (tf >= 0) {
                this.pics[1].intack(tf);
            } else {
                tf = 7;
            }
            intno = this.pics[1].irq_base + tf;
            kf = tf + 8;
        } else {
            intno = this.pics[0].irq_base + kf;
        }
    } else {
        kf = 7;
        intno = this.pics[0].irq_base + kf;
    }
    this.update_irq();
    return intno;
};

function uf(ef, vf, wf) {
    var s, i;
    this.pit_channels = new Array;
    for (i = 0; i < 3; i++) {
        s = new xf(wf);
        this.pit_channels[i] = s;
        s.mode = 3;
        s.gate = (i != 2) >> 0;
        s.pit_load_count(0);
    }
    this.speaker_data_on = 0;
    this.set_irq = vf;
    ef.register_ioport_write(64, 4, 1, this.ioport_write.bind(this));
    ef.register_ioport_read(64, 3, 1, this.ioport_read.bind(this));
    ef.register_ioport_read(97, 1, 1, this.speaker_ioport_read.bind(this));
    ef.register_ioport_write(97, 1, 1, this.speaker_ioport_write.bind(this));
}

function xf(wf) {
    this.count = 0;
    this.latched_count = 0;
    this.rw_state = 0;
    this.mode = 0;
    this.bcd = 0;
    this.gate = 0;
    this.count_load_time = 0;
    this.get_ticks = wf;
    this.pit_time_unit = 1193182 / 2e6;
}

xf.prototype.get_time = function() {
    return Math.floor(this.get_ticks() * this.pit_time_unit);
};

xf.prototype.pit_get_count = function() {
    var d, yf;
    d = this.get_time() - this.count_load_time;
    switch (this.mode) {
      case 0:
      case 1:
      case 4:
      case 5:
        yf = this.count - d & 65535;
        break;
      default:
        yf = this.count - d % this.count;
        break;
    }
    return yf;
};

xf.prototype.pit_get_out = function() {
    var d, zf;
    d = this.get_time() - this.count_load_time;
    switch (this.mode) {
      default:
      case 0:
        zf = (d >= this.count) >> 0;
        break;
      case 1:
        zf = (d < this.count) >> 0;
        break;
      case 2:
        if (d % this.count == 0 && d != 0) zf = 1; else zf = 0;
        break;
      case 3:
        zf = (d % this.count < this.count >> 1) >> 0;
        break;
      case 4:
      case 5:
        zf = (d == this.count) >> 0;
        break;
    }
    return zf;
};

xf.prototype.get_next_transition_time = function() {
    var d, Af, base, Bf;
    d = this.get_time() - this.count_load_time;
    switch (this.mode) {
      default:
      case 0:
      case 1:
        if (d < this.count) Af = this.count; else return -1;
        break;
      case 2:
        base = d / this.count * this.count;
        if (d - base == 0 && d != 0) Af = base + this.count; else Af = base + this.count + 1;
        break;
      case 3:
        base = d / this.count * this.count;
        Bf = this.count + 1 >> 1;
        if (d - base < Bf) Af = base + Bf; else Af = base + this.count;
        break;
      case 4:
      case 5:
        if (d < this.count) Af = this.count; else if (d == this.count) Af = this.count + 1; else return -1;
        break;
    }
    Af = this.count_load_time + Af;
    return Af;
};

xf.prototype.pit_load_count = function(ga) {
    if (ga == 0) ga = 65536;
    this.count_load_time = this.get_time();
    this.count = ga;
};

uf.prototype.ioport_write = function(fa, ga) {
    var Cf, Df, s;
    fa &= 3;
    if (fa == 3) {
        Cf = ga >> 6;
        if (Cf == 3) return;
        s = this.pit_channels[Cf];
        Df = ga >> 4 & 3;
        switch (Df) {
          case 0:
            s.latched_count = s.pit_get_count();
            s.rw_state = 4;
            break;
          default:
            s.mode = ga >> 1 & 7;
            s.bcd = ga & 1;
            s.rw_state = Df - 1 + 0;
            break;
        }
    } else {
        s = this.pit_channels[fa];
        switch (s.rw_state) {
          case 0:
            s.pit_load_count(ga);
            break;
          case 1:
            s.pit_load_count(ga << 8);
            break;
          case 2:
          case 3:
            if (s.rw_state & 1) {
                s.pit_load_count(s.latched_count & 255 | ga << 8);
            } else {
                s.latched_count = ga;
            }
            s.rw_state ^= 1;
            break;
        }
    }
};

uf.prototype.ioport_read = function(fa) {
    var gf, ma, s;
    fa &= 3;
    s = this.pit_channels[fa];
    switch (s.rw_state) {
      case 0:
      case 1:
      case 2:
      case 3:
        ma = s.pit_get_count();
        if (s.rw_state & 1) gf = ma >> 8 & 255; else gf = ma & 255;
        if (s.rw_state & 2) s.rw_state ^= 1;
        break;
      default:
      case 4:
      case 5:
        if (s.rw_state & 1) gf = s.latched_count >> 8; else gf = s.latched_count & 255;
        s.rw_state ^= 1;
        break;
    }
    return gf;
};

uf.prototype.speaker_ioport_write = function(fa, ga) {
    this.speaker_data_on = ga >> 1 & 1;
    this.pit_channels[2].gate = ga & 1;
};

uf.prototype.speaker_ioport_read = function(fa) {
    var zf, s, ga;
    s = this.pit_channels[2];
    zf = s.pit_get_out();
    ga = this.speaker_data_on << 1 | s.gate | zf << 5;
    return ga;
};

uf.prototype.update_irq = function() {
    this.set_irq(1);
    this.set_irq(0);
};

function Ef(ef, fa, Ff, Gf) {
    this.divider = 0;
    this.rbr = 0;
    this.ier = 0;
    this.iir = 1;
    this.lcr = 0;
    this.mcr;
    this.lsr = 64 | 32;
    this.msr = 0;
    this.scr = 0;
    this.set_irq_func = Ff;
    this.write_func = Gf;
    this.receive_fifo = "";
    ef.register_ioport_write(1016, 8, 1, this.ioport_write.bind(this));
    ef.register_ioport_read(1016, 8, 1, this.ioport_read.bind(this));
}

Ef.prototype.update_irq = function() {
    if (this.lsr & 1 && this.ier & 1) {
        this.iir = 4;
    } else if (this.lsr & 32 && this.ier & 2) {
        this.iir = 2;
    } else {
        this.iir = 1;
    }
    if (this.iir != 1) {
        this.set_irq_func(1);
    } else {
        this.set_irq_func(0);
    }
};

Ef.prototype.ioport_write = function(fa, ga) {
    fa &= 7;
    switch (fa) {
      default:
      case 0:
        if (this.lcr & 128) {
            this.divider = this.divider & 65280 | ga;
        } else {
            this.lsr &= ~32;
            this.update_irq();
            this.write_func(String.fromCharCode(ga));
            this.lsr |= 32;
            this.lsr |= 64;
            this.update_irq();
        }
        break;
      case 1:
        if (this.lcr & 128) {
            this.divider = this.divider & 255 | ga << 8;
        } else {
            this.ier = ga;
            this.update_irq();
        }
        break;
      case 2:
        break;
      case 3:
        this.lcr = ga;
        break;
      case 4:
        this.mcr = ga;
        break;
      case 5:
        break;
      case 6:
        this.msr = ga;
        break;
      case 7:
        this.scr = ga;
        break;
    }
};

Ef.prototype.ioport_read = function(fa) {
    var gf;
    fa &= 7;
    switch (fa) {
      default:
      case 0:
        if (this.lcr & 128) {
            gf = this.divider & 255;
        } else {
            gf = this.rbr;
            this.lsr &= ~(1 | 16);
            this.update_irq();
            this.send_char_from_fifo();
        }
        break;
      case 1:
        if (this.lcr & 128) {
            gf = this.divider >> 8 & 255;
        } else {
            gf = this.ier;
        }
        break;
      case 2:
        gf = this.iir;
        break;
      case 3:
        gf = this.lcr;
        break;
      case 4:
        gf = this.mcr;
        break;
      case 5:
        gf = this.lsr;
        break;
      case 6:
        gf = this.msr;
        break;
      case 7:
        gf = this.scr;
        break;
    }
    return gf;
};

Ef.prototype.send_break = function() {
    this.rbr = 0;
    this.lsr |= 16 | 1;
    this.update_irq();
};

Ef.prototype.send_char = function(Hf) {
    this.rbr = Hf;
    this.lsr |= 1;
    this.update_irq();
};

Ef.prototype.send_char_from_fifo = function() {
    var If;
    If = this.receive_fifo;
    if (If != "" && !(this.lsr & 1)) {
        this.send_char(If.charCodeAt(0));
        this.receive_fifo = If.substr(1, If.length - 1);
    }
};

Ef.prototype.send_chars = function(na) {
    this.receive_fifo += na;
    this.send_char_from_fifo();
};

function Jf(ef, Kf) {
    ef.register_ioport_read(100, 1, 1, this.read_status.bind(this));
    ef.register_ioport_write(100, 1, 1, this.write_command.bind(this));
    this.reset_request = Kf;
}

Jf.prototype.read_status = function(fa) {
    return 0;
};

Jf.prototype.write_command = function(fa, ga) {
    switch (ga) {
      case 254:
        this.reset_request();
        break;
      default:
        break;
    }
};

function Lf(ef, jf, Mf, Gf, Nf) {
    ef.register_ioport_read(jf, 16, 4, this.ioport_readl.bind(this));
    ef.register_ioport_write(jf, 16, 4, this.ioport_writel.bind(this));
    ef.register_ioport_read(jf + 8, 1, 1, this.ioport_readb.bind(this));
    ef.register_ioport_write(jf + 8, 1, 1, this.ioport_writeb.bind(this));
    this.cur_pos = 0;
    this.doc_str = "";
    this.read_func = Mf;
    this.write_func = Gf;
    this.get_boot_time = Nf;
}

Lf.prototype.ioport_writeb = function(fa, ga) {
    this.doc_str += String.fromCharCode(ga);
};

Lf.prototype.ioport_readb = function(fa) {
    var c, na, ga;
    na = this.doc_str;
    if (this.cur_pos < na.length) {
        ga = na.charCodeAt(this.cur_pos) & 255;
    } else {
        ga = 0;
    }
    this.cur_pos++;
    return ga;
};

Lf.prototype.ioport_writel = function(fa, ga) {
    var na;
    fa = fa >> 2 & 3;
    switch (fa) {
      case 0:
        this.doc_str = this.doc_str.substr(0, ga >>> 0);
        break;
      case 1:
        return this.cur_pos = ga >>> 0;
      case 2:
        na = String.fromCharCode(ga & 255) + String.fromCharCode(ga >> 8 & 255) + String.fromCharCode(ga >> 16 & 255) + String.fromCharCode(ga >> 24 & 255);
        this.doc_str += na;
        break;
      case 3:
        this.write_func(this.doc_str);
    }
};

Lf.prototype.ioport_readl = function(fa) {
    var ga;
    fa = fa >> 2 & 3;
    switch (fa) {
      case 0:
        this.doc_str = this.read_func();
        return this.doc_str.length >> 0;
      case 1:
        return this.cur_pos >> 0;
      case 2:
        ga = this.ioport_readb(0);
        ga |= this.ioport_readb(0) << 8;
        ga |= this.ioport_readb(0) << 16;
        ga |= this.ioport_readb(0) << 24;
        return ga;
      case 3:
        if (this.get_boot_time) return this.get_boot_time() >> 0; else return 0;
    }
};

function sf(lf) {
    this.hard_irq = lf;
}

function Of() {
    return this.cycle_count;
}

function PCEmulator(Pf) {
    var wa;
    wa = new CPU_X86;
    this.cpu = wa;
    wa.phys_mem_resize(Pf.mem_size);
    this.init_ioports();
    this.register_ioport_write(128, 1, 1, this.ioport80_write);
    this.pic = new qf(this, 32, 160, sf.bind(wa));
    this.pit = new uf(this, this.pic.set_irq.bind(this.pic, 0), Of.bind(wa));
    this.cmos = new df(this);
    this.serial = new Ef(this, 1016, this.pic.set_irq.bind(this.pic, 4), Pf.serial_write);
    this.kbd = new Jf(this, this.reset.bind(this));
    this.reset_request = 0;
    if (Pf.clipboard_get && Pf.clipboard_set) {
        this.jsclipboard = new Lf(this, 960, Pf.clipboard_get, Pf.clipboard_set, Pf.get_boot_time);
    }
    wa.ld8_port = this.ld8_port.bind(this);
    wa.ld16_port = this.ld16_port.bind(this);
    wa.ld32_port = this.ld32_port.bind(this);
    wa.st8_port = this.st8_port.bind(this);
    wa.st16_port = this.st16_port.bind(this);
    wa.st32_port = this.st32_port.bind(this);
    wa.get_hard_intno = this.pic.get_hard_intno.bind(this.pic);
}

PCEmulator.prototype.load_binary = function(Xe, ha) {
    return this.cpu.load_binary(Xe, ha);
};

PCEmulator.prototype.start = function() {
    setTimeout(this.timer_func.bind(this), 10);
};

PCEmulator.prototype.timer_func = function() {
    var La, Qf, Rf, Sf, Tf, ef, wa;
    ef = this;
    wa = ef.cpu;
    Rf = wa.cycle_count + 1e5;
    Sf = false;
    Tf = false;
    Uf : while (wa.cycle_count < Rf) {
        ef.pit.update_irq();
        La = wa.exec(Rf - wa.cycle_count);
        if (La == 256) {
            if (ef.reset_request) {
                Sf = true;
                break;
            }
        } else if (La == 257) {
            Tf = true;
            break;
        } else {
            Sf = true;
            break;
        }
    }
    if (!Sf) {
        if (Tf) {
            setTimeout(this.timer_func.bind(this), 10);
        } else {
            setTimeout(this.timer_func.bind(this), 0);
        }
    }
};

PCEmulator.prototype.init_ioports = function() {
    var i, Vf, Wf;
    this.ioport_readb_table = new Array;
    this.ioport_writeb_table = new Array;
    this.ioport_readw_table = new Array;
    this.ioport_writew_table = new Array;
    this.ioport_readl_table = new Array;
    this.ioport_writel_table = new Array;
    Vf = this.default_ioport_readw.bind(this);
    Wf = this.default_ioport_writew.bind(this);
    for (i = 0; i < 1024; i++) {
        this.ioport_readb_table[i] = this.default_ioport_readb;
        this.ioport_writeb_table[i] = this.default_ioport_writeb;
        this.ioport_readw_table[i] = Vf;
        this.ioport_writew_table[i] = Wf;
        this.ioport_readl_table[i] = this.default_ioport_readl;
        this.ioport_writel_table[i] = this.default_ioport_writel;
    }
};

PCEmulator.prototype.default_ioport_readb = function(jf) {
    var ga;
    ga = 255;
    return ga;
};

PCEmulator.prototype.default_ioport_readw = function(jf) {
    var ga;
    ga = this.ioport_readb_table[jf](jf);
    jf = jf + 1 & 1024 - 1;
    ga |= this.ioport_readb_table[jf](jf) << 8;
    return ga;
};

PCEmulator.prototype.default_ioport_readl = function(jf) {
    var ga;
    ga = -1;
    return ga;
};

PCEmulator.prototype.default_ioport_writeb = function(jf, ga) {};

PCEmulator.prototype.default_ioport_writew = function(jf, ga) {
    this.ioport_writeb_table[jf](jf, ga & 255);
    jf = jf + 1 & 1024 - 1;
    this.ioport_writeb_table[jf](jf, ga >> 8 & 255);
};

PCEmulator.prototype.default_ioport_writel = function(jf, ga) {};

PCEmulator.prototype.ld8_port = function(jf) {
    var ga;
    ga = this.ioport_readb_table[jf & 1024 - 1](jf);
    return ga;
};

PCEmulator.prototype.ld16_port = function(jf) {
    var ga;
    ga = this.ioport_readw_table[jf & 1024 - 1](jf);
    return ga;
};

PCEmulator.prototype.ld32_port = function(jf) {
    var ga;
    ga = this.ioport_readl_table[jf & 1024 - 1](jf);
    return ga;
};

PCEmulator.prototype.st8_port = function(jf, ga) {
    this.ioport_writeb_table[jf & 1024 - 1](jf, ga);
};

PCEmulator.prototype.st16_port = function(jf, ga) {
    this.ioport_writew_table[jf & 1024 - 1](jf, ga);
};

PCEmulator.prototype.st32_port = function(jf, ga) {
    this.ioport_writel_table[jf & 1024 - 1](jf, ga);
};

PCEmulator.prototype.register_ioport_read = function(start, cd, Xf, Yf) {
    var i;
    switch (Xf) {
      case 1:
        for (i = start; i < start + cd; i++) {
            this.ioport_readb_table[i] = Yf;
        }
        break;
      case 2:
        for (i = start; i < start + cd; i += 2) {
            this.ioport_readw_table[i] = Yf;
        }
        break;
      case 4:
        for (i = start; i < start + cd; i += 4) {
            this.ioport_readl_table[i] = Yf;
        }
        break;
    }
};

PCEmulator.prototype.register_ioport_write = function(start, cd, Xf, Yf) {
    var i;
    switch (Xf) {
      case 1:
        for (i = start; i < start + cd; i++) {
            this.ioport_writeb_table[i] = Yf;
        }
        break;
      case 2:
        for (i = start; i < start + cd; i += 2) {
            this.ioport_writew_table[i] = Yf;
        }
        break;
      case 4:
        for (i = start; i < start + cd; i += 4) {
            this.ioport_writel_table[i] = Yf;
        }
        break;
    }
};

PCEmulator.prototype.ioport80_write = function(fa, Ze) {};

PCEmulator.prototype.reset = function() {
    this.request_request = 1;
};