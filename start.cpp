#include "start.h"
#include "ui_start.h"
#include <QMainWindow>

Start::Start(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::Start)
{
    ui->setupUi(this);
    setWindowFlags(Qt::WindowCloseButtonHint);
}

Start::~Start()
{
    delete ui;
}

void Start::on_actionKeluar_triggered()
{
    close();
}
