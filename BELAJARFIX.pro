#-------------------------------------------------
#
# Project created by QtCreator 2013-07-22T23:35:24
#
#-------------------------------------------------

QT       += core gui network webkit

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = BELAJARFIX
TEMPLATE = app


SOURCES += main.cpp\
        mainwindow.cpp \
    maindeb.cpp \
    SlidingStackedWidget.cpp \
    ubuntu.cpp \
    mint.cpp \
    debian.cpp \
    start.cpp \
    linux_info.cpp \
    ign.cpp


HEADERS  += mainwindow.h \
    maindeb.h \
    SlidingStackedWidget.h \
    ubuntu.h \
    mint.h \
    debian.h \
    start.h \
    linux_info.h \
    ign.h

FORMS    += mainwindow.ui \
    maindeb.ui \
    start.ui \
    linux_info.ui

RESOURCES += \
    resources.qrc

LIBS += -L/usr/lib -lqjson

OTHER_FILES += \
    jslinux/vmlinux26.bin \
    jslinux/term.js \
    jslinux/root.bin \
    jslinux/linuxstart.bin \
    jslinux/jslinux.js \
    jslinux/index.html \
    jslinux/cpux86-ta.js \
    jslinux/cpux86.js
