#include "ign.h"
#include "ui_maindeb.h"

Ign::Ign(QWidget *parent) :
    MainDeb(parent)
{
    //addcombobox
    ui->comboBox->addItem("1");
    ui->comboBox->addItem("2");

    //add widget 1
    ui->textEdit->setHtml(QApplication::translate("MainDeb", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
                                                  "<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
                                                  "p, li { white-space: pre-wrap; }\n"
                                                  "</style></head><body style=\" font-family:'Sans'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
                                                  "<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-weight:600;\">IGN</span></p>\n"
                                                  "<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><br /></p>\n"
                                                  "<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">IGOS Nusantara disingkat IGN adalah sistem operasi dengan perangkat lunak legal, handal dan tanpa membayar lisensi untuk pengguna di Indonesia. IGOS Nusantara dikembangkan oleh Pusat Penelitian Informatika Lembaga Ilmu Pengetahuan Indone"
                                                                          "sia bersama dengan komunitas. IGOS Nusantara secara konsisten dikembangkan sejak tahun 2006. Setiap tahun dikeluarkan versi baru. Versi pertama dirilis tahun 2006 memakai nama IGN 2006 (R1), lalu IGN 2007 (R2), IGN 2008 (R3), IGN 2009 (R4), IGN 2010  (R5) dan IGN 2011 (R6). Mulai rilis ketujuh atau R7, IGOS Nusantara tidak memakai kode tahun. Tahun 2012 tersedia rilis delapan atau IGN R8.0. Sejak IGN R8.0, selain versi 32bit juga tersedia versi 64bit.</p>\n"
                                                  "<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><br /></p></body></html>", 0, QApplication::UnicodeUTF8));
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
