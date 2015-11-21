
echo "install Wget tool"
yum install wget -y 

echo "fetching shared gpl"
wget http://ftp.kaist.ac.kr/mysql/Downloads/MySQL-Cluster-7.4/MySQL-Cluster-shared-gpl-7.4.7-1.el7.x86_64.rpm

echo "fetching server gpl"
wget http://ftp.kaist.ac.kr/mysql/Downloads/MySQL-Cluster-7.4/MySQL-Cluster-server-gpl-7.4.7-1.el7.x86_64.rpm


echo "install cluster shared"
yum install MySQL-Cluster-shared-gpl-7.4.7-1.el7.x86_64.rpm -y

echo "install perl-data-dumper"
yum install perl-Data-Dumper -y

echo "install shared gpl"
yum install MySQL-Cluster-server-gpl-7.4.7-1.el7.x86_64.rpm -y

echo "install firewalld" 
yum install firewalld -y

echo "Nothing to be done!"
