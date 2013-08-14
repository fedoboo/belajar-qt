#ifndef DEBIAN_H
#define DEBIAN_H

#include <QMainWindow>
#include "maindeb.h"

class Debian : public MainDeb
{
    Q_OBJECT
public:
    explicit Debian(QWidget *parent = 0);
public :
    QWidget *centralWidget;
    QWidget *slideWidget2;
    QVBoxLayout *slideWidget2layout;
    QTextEdit *textEdit_2;
    //menambahkan widget/slide baru silahkan merujuk ke file mint.h dan mint.cpp
signals:
    
public slots:
    
};

#endif // DEBIAN_H
