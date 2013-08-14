#ifndef IGN_H
#define IGN_H

#include <QMainWindow>
#include "maindeb.h"

class Ign : public MainDeb
{
    Q_OBJECT
public:
    explicit Ign(QWidget *parent = 0);
public :
    QWidget *centralWidget;
    QWidget *slideWidget2;
    QVBoxLayout *slideWidget2layout;
    QTextEdit *textEdit_2;
    //menambahkan widget/slide baru silahkan merujuk ke file mint.h dan mint.cpp
signals:

public slots:

};

#endif // IGN_H
