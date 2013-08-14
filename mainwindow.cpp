#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QApplication>
#include <iostream>
#include <QtCore>
#include <QtGui>
#include <QWebView>




MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

}

MainWindow::~MainWindow()
{
    delete ui;
}


void MainWindow::on_buttonTerminal_clicked()
{
    terminal = new QWebView();
    terminal->setUrl(QUrl("qrc:/icon/jslinux/index.html"));
    terminal->resize(665,532);
    terminal->setFixedSize(terminal->size());
    terminal->show();


}

void MainWindow::on_buttonDeb_clicked()
{
    maindeb = new Debian(this);
    maindeb->setWindowTitle("Info Debian");
    QIcon icon;
            icon.addFile(QString::fromUtf8(":/icon/img/dist_deb.png"), QSize(), QIcon::Normal, QIcon::Off);
    maindeb->setWindowIcon(icon);
    maindeb->show();
}


void MainWindow::on_toolButton_2_clicked()
{
    QMessageBox::information(this, "About Me",
                             "App By Meong45");
}

void MainWindow::on_pushButton_clicked()
{
    mainubuntu = new Ubuntu(this);
    mainubuntu->setWindowTitle("Info Ubuntu");
    QIcon icon;
            icon.addFile(QString::fromUtf8(":/icon/img/dist_ubuntu.png"), QSize(), QIcon::Normal, QIcon::Off);
    mainubuntu->setWindowIcon(icon);
    mainubuntu->show();

}

void MainWindow::on_pushButton_2_clicked()
{
    mainmint = new Mint(this);
    mainmint->setWindowTitle("Info Mint");
    QIcon icon;
            icon.addFile(QString::fromUtf8(":/icon/img/dist_mint.png"), QSize(), QIcon::Normal, QIcon::Off);
    mainmint->setWindowIcon(icon);
    mainmint->show();
}
void MainWindow::on_pushButton_3_clicked()
{
    ign = new Ign(this);
    ign->setWindowTitle("Info Igos Nusantara");
    QIcon icon;
    icon.addFile(QString::fromUtf8(":/icon/img/igos.png"), QSize(), QIcon::Normal, QIcon::Off);
    ign->setWindowIcon(icon);
    ign->show();
}

void MainWindow::on_buttonMenu_clicked()
{
    start.show();
    start.setFixedSize(start.size());

}
