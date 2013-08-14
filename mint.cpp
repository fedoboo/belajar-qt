#include "mint.h"
#include "ui_maindeb.h"

Mint::Mint(QWidget *parent) :
    MainDeb(parent)
{
    //adcombobox
    ui->comboBox->addItem("1");
    ui->comboBox->addItem("2");

    //widget 1
    ui->textEdit->setHtml(QApplication::translate("MainDeb", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
                                                  "<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
                                                  "p, li { white-space: pre-wrap; }\n"
                                                  "</style></head><body style=\" font-family:'Sans'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
                                                  "<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">LINUX MINT</p>\n"
                                                  "<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Linux Mint adalah sistem operasi berbasis Linux untuk PC. Inti dari LinuxMint adalah Ubuntu, sehingga aplikasi yang dapat berjalan di Ubuntu, juga bisa berjalan pada LinuxMint. Walaupun inti dari LinuxMint adalah Ubuntu, LinuxMint hadir dengan tampilan yang berbeda dengan Ubuntu.</p>\n"
                                                  "<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;"
                                                                          "\"><br /></p></body></html>", 0, QApplication::UnicodeUTF8));
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
    //widget 3
    slideWidget3 = new QWidget(centralWidget);
    slideWidget3->setObjectName(QString::fromUtf8("slideWidget3"));
    slideWidget3layout = new QVBoxLayout(slideWidget3);
    slideWidget3layout->setSpacing(6);
    slideWidget3layout->setContentsMargins(11, 11, 11, 11);
    slideWidget3layout->setObjectName(QString::fromUtf8("slideWidget3layout"));
    textEdit_3 = new QTextEdit(slideWidget3);
    textEdit_3->setObjectName(QString::fromUtf8("textEdit_3"));
    slideWidget3layout->addWidget(textEdit_3);

    slidingStacked->addWidget(slideWidget3);
    /* - menambahkan widget
    slideWidget4 = new QWidget(centralWidget);
    slideWidget4->setObjectName(QString::fromUtf8("slideWidget4"));
    slideWidget4layout = new QVBoxLayout(slideWidget4);
    slideWidget4layout->setSpacing(6);
    slideWidget4layout->setContentsMargins(11, 11, 11, 11);
    slideWidget4layout->setObjectName(QString::fromUtf8("slideWidget4layout"));
    textEdit_4 = new QTextEdit(slideWidget4);
    textEdit_4->setObjectName(QString::fromUtf8("textEdit_4"));
    textEdit_4->setText("meong45");
    slideWidget4layout->addWidget(textEdit_4);

    slidingStacked->addWidget(slideWidget4);
    */

}
