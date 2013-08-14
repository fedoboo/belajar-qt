#include "maindeb.h"
#include "ui_maindeb.h"

MainDeb::MainDeb(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainDeb)
{
    ui->setupUi(this);
    animTime=500;
    createGuiControlComponents();
    createSubSlidingWidgets();
    createSlidingStackedWidget();
    createMainLayout();
    createConnections();
    //add item
}

MainDeb::~MainDeb()
{
    delete ui;
}
void MainDeb::createGuiControlComponents() {
    int _min=500;
    int _max=1500;
    animTime=(_min+_max)>>1;


}

void MainDeb::createMainLayout() {


    ui->centralWidget->setLayout(ui->mainLayout);


    ui->mainLayout->addWidget(slidingStacked);
    ui->mainLayout->addLayout(ui->controlPaneLayout);


    this->setCentralWidget(ui->centralWidget);
}

void MainDeb::createSubSlidingWidgets() {


    ui->slideWidget1->setLayout(ui->slideWidget1layout);
    ui->slideWidget1layout->addWidget(ui->textEdit);

}

void MainDeb::createSlidingStackedWidget() {
    slidingStacked= new SlidingStackedWidget(this);
    slidingStacked->addWidget(ui->slideWidget1);
    slidingStacked->setSpeed(animTime);
}

void MainDeb::createConnections() {
    QObject::connect(ui->buttonNext,SIGNAL(pressed()),slidingStacked,SLOT(slideInNext()));
    QObject::connect(ui->buttonPrev,SIGNAL(pressed()),slidingStacked,SLOT(slideInPrev()));
    QObject::connect(ui->comboBox,SIGNAL(currentIndexChanged(int)),slidingStacked,SLOT(slideInIdx(int)));
    QObject::connect(ui->checkVertical,SIGNAL(clicked(bool)),slidingStacked,SLOT(setVerticalMode(bool)));
}


