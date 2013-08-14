#ifndef MAINDEB_H
#define MAINDEB_H

#include <QMainWindow>
#include <QSlider>
#include <QtGui>
#include "SlidingStackedWidget.h"
#include <QSpacerItem>


namespace Ui {
class MainDeb;
}

class MainDeb : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit MainDeb(QWidget *parent = 0);
    ~MainDeb();

public:
    Ui::MainDeb *ui;
protected:
    void createGuiControlComponents();
    void createMainLayout();
    void createSubSlidingWidgets();
    void createConnections();
    void createSlidingStackedWidget();

    SlidingStackedWidget *slidingStacked;
    int animTime;
};

#endif // MAINDEB_H
