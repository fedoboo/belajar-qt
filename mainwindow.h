#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QtGui/QApplication>
#include <QtWebKit/QWebView>
#include "maindeb.h"
#include "ubuntu.h"
#include "mint.h"
#include "debian.h"
#include "ign.h"
#include "start.h"
#include "linux_info.h"

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

private slots:
   void on_buttonTerminal_clicked();

   void on_buttonDeb_clicked();

   void on_toolButton_2_clicked();

   void on_pushButton_clicked();

   void on_pushButton_2_clicked();

   void on_pushButton_3_clicked();

   void on_buttonMenu_clicked();

private:
    Ui::MainWindow *ui;
    Debian *maindeb;
    Ubuntu *mainubuntu;
    Mint *mainmint;
    MainDeb *igos;
    QWebView *terminal;
    Ign *ign;
    Start start;


};

#endif // MAINWINDOW_H
