#ifndef START_H
#define START_H

#include <QMainWindow>

namespace Ui {
class Start;
}

class Start : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit Start(QWidget *parent = 0);
    ~Start();
    
private slots:
    void on_actionKeluar_triggered();

private:
    Ui::Start *ui;
};

#endif // START_H
