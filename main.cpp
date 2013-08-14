#include "mainwindow.h"
#include <QApplication>
#include <QMainWindow>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow w;
    w.setWindowFlags(Qt::WindowCloseButtonHint);
    w.setAttribute(Qt::WA_TranslucentBackground);
    w.setFixedSize(w.size());
    w.show();


    return a.exec();
}
