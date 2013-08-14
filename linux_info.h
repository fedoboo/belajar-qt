#ifndef LINUX_INFO_H
#define LINUX_INFO_H

#include <QWidget>

namespace Ui {
class Linux_info;
}

class Linux_info : public QWidget
{
    Q_OBJECT
    
public:
    explicit Linux_info(QWidget *parent = 0);
    ~Linux_info();
    
private:
    Ui::Linux_info *ui;
};

#endif // LINUX_INFO_H
