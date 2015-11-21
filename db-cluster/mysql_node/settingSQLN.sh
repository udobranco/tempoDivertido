cp ./my.cnf /etc/

mysqld_safe &

echo " Fetching the password for secure installation"
cat /root/.mysql_secret

echo "ont forget to set new pw 101 for fast typing and go default"
mysql_secure_installation

echo "setting firewall port"
mysqladmin shutdown

firewall-cmd --permanent -add-service mysql 
firewall-cmd --reload

