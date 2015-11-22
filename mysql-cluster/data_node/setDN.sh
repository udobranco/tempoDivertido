
echo ">>>>> creating user <<<<<"
groupadd mysql
useradd -g mysql mysql

echo ">>>>> downloading and extrating files <<<<<"
apt-get install wget -y
wget https://downloads.mariadb.com/archives/mysql-cluster-gpl-7.3/mysql-cluster-gpl-7.3.3-linux-glibc2.5-x86_64.tar.gz
tar xvfz mysql-cluster-gpl-7.3.3-linux-glibc2.5-x86_64.tar.gz

echo ">>>>> creating symbolic link  point to the extracted folder <<<<<"
ln -s mysql-cluster-gpl-7.3.3-linux-glibc2.5-x86_64 mysql

cd mysql
apt-get install libaio1 libaio-dev

echo">>>>> database install <<<<<"
scripts/mysql_install_db --user=mysql --datadir=/usr/local/mysql/data

echo ">>>>> changing the owner to the group user created <<<<<"
chown -R root:mysql .
chown -R mysql data

echo ">>>>>set to run automatically <<<<<"
cp support-files/mysql.server /etc/init.d/
chmod 755 /etc/init.d/mysql.server

echo ">>>>> copy all bin files to /usr/bin and create symlink to keep all references <<<<<"
cd /usr/local/mysql/bin
mv * /usr/bin
cd ../
rm -fr /usr/local/mysql/bin
ln -s /usr/bin /usr/local/mysql/bin

echo ">>>>> copying .cnf file to /etc/ <<<<<" 
cp /tempodivertido/mysql-cluster/data_nodes/my.cnf /etc

echo ">>>>> creating data folders for mySQL <<<<<"
mkdir /var/lib/mysql-cluster

echo ">>>>> initializing cluster and starting service <<<<<"
cd /var/lib/mysql-cluster
ndbd --initial
/etc/init.d/mysql.server start

echo ">>>>> secure MySql instalation <<<<<"
/usr/local/mysql/bin/mysql_secure_installation

echo ">>>>> set up ndb to start automatically <<<<<"
echo "ndbd" > /etc/init.d/ndbd
chmod 755 /etc/init.d/ndbd 

