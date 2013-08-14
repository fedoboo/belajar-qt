#include "debian.h"
#include "ui_maindeb.h"

Debian::Debian(QWidget *parent) :
    MainDeb(parent)
{
    //addcombobox
    ui->comboBox->addItem("1");
    ui->comboBox->addItem("2");

    //add widget 1
    ui->textEdit->setText("Meong");
    //widget 2
    centralWidget = new QWidget;
    centralWidget->setObjectName(QString::fromUtf8("centralWidget"));
    slideWidget2 = new QWidget(centralWidget);
    slideWidget2->setObjectName(QString::fromUtf8("slideWidget2"));
    slideWidget2layout = new QVBoxLayout(slideWidget2);
    slideWidget2layout->setSpacing(6);
    slideWidget2layout->setContentsMargins(11, 11, 11, 11);
    slideWidget2layout->setObjectName(QString::fromUtf8("slideWidget2layout"));
    textEdit_2 = new QTextEdit(slideWidget2);
    textEdit_2->setObjectName(QString::fromUtf8("textEdit_2"));
    slideWidget2layout->addWidget(textEdit_2);
    slidingStacked->addWidget(slideWidget2);
}
