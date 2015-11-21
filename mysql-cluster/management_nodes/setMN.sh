mkdir /usr/src/mysql-mgm
cd /usr/src/mysql-mgm

apt-get install wget -y
wget https://downloads.mariadb.com/archives/mysql-cluster-gpl-7.3/mysql-cluster-gpl-7.3.3-linux-glibc2.5-x86_64.tar.gz
tar xvfz mysql-cluster-gpl-7.3.3-linux-glibc2.5-x86_64.tar.gz

cd mysql-cluster-gpl-7.3.3-linux-glibc2.5-x86_64
cp bin/ndb_mgm /usr/bin
cp bin/ndb_mgmd /usr/bin

chmod 755 /usr/bin/ndb_mg*
cd /usr/src
rm -rf /usr/src/mysql-mgm

mkdir /var/lib/mysql-cluster
cp /home/tempodivertido/mysql-cluster/management_nodes/config.ini

ndb_mgmd -f /var/lib/mysql-cluster/config.ini --configdir=/var/lib/mysql-cluster/

echo "ndb_mgmd -f /var/lib/mysql-cluster/config.ini --configdir=/var/lib/mysql-cluster/" > /etc/init.d/ndb_mgmd
chmod 755 /etc/init.d/ndb_mgmd
