mkdir /var/lib/mycluster
cp ./config.ini /var/lib/mycluster

echo "starting service"
ndb_mgmd -f /var/lib/mycluster/config.ini
