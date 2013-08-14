#include "linux_info.h"
#include "ui_linux_info.h"

Linux_info::Linux_info(QWidget *parent) :
    QWidget(parent),
    ui(new Ui::Linux_info)
{
    ui->setupUi(this);
}

Linux_info::~Linux_info()
{
    delete ui;
}
