echo "Launching a 5 node MySql db cluster"

echo "Launching LoadBalance Node (1/5)"
docker run -dt -it --name ubuvm00 -p 10.5.50.32:11111:11111 ubuntu /bin/bash    
echo "Launching 1st Management Node (2/5)"
docker run -dt -it --name ubuvm01 -p 10.5.50.32:22222:22222 ubuntu /bin/bash    
echo "Launching 1st Data (1/5)"
docker run -dt -it --name ubuvm02 -p 10.5.50.32:33333:33333 ubuntu /bin/bash    
echo "Launching 2nd Management Node 4/5)"
docker run -dt -it --name ubuvm03 -p 10.5.50.32:44444:44444 ubuntu /bin/bash    
echo "Launching 2nd Data Node (5/5)"
docker run -dt -it --name ubuvm04 -p 10.5.50.32:55555:55555 ubuntu /bin/bash    

echo ">>>>> Please take note of the IP to change the Config files on the db cluster <<<<<"

docker-ip ubuvm01
docker-ip ubuvm02
docker-ip ubuvm03
docker-ip ubuvm04

echo "Done!"
