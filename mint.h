#ifndef MINT_H
#define MINT_H

#include <QMainWindow>
#include "maindeb.h"


class Mint : public MainDeb
{
    Q_OBJECT
public:
    explicit Mint(QWidget *parent = 0);

public:
    QWidget *centralWidget;
    QWidget *slideWidget2;
    QVBoxLayout *slideWidget2layout;
    QTextEdit *textEdit_2;

    QWidget *slideWidget3;
    QVBoxLayout *slideWidget3layout;
    QTextEdit *textEdit_3;

    /* - menambahkan widget
    QWidget *slideWidget4;
    QVBoxLayout *slideWidget4layout;
    QTextEdit *textEdit_4;
    */
signals:
    
public slots:
    
};

#endif // MINT_H
