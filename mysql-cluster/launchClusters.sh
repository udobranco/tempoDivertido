echo "Launching a 5 node MySql db cluster"

echo "Launching LoadBalance Node (1/5)"
docker run -dt -it --name ubuvm00 -p 10.5.50.32:11111:11111 --expose 1186 ubuntu /bin/bash    
echo "Launching 1st Management Node (2/5)"
docker run -dt -it --name ubuvm01 -p 10.5.50.32:22222:22222 --expose 1186 ubuntu /bin/bash    
echo "Launching 1st Data (1/5)"
docker run -dt -it --name ubuvm02 -p 10.5.50.32:33333:33333 --expose 1186 ubuntu /bin/bash    
echo "Launching 2nd Management Node 4/5)"
docker run -dt -it --name ubuvm03 -p 10.5.50.32:44444:44444 --expose 1186 ubuntu /bin/bash    
echo "Launching 2nd Data Node (5/5)"
docker run -dt -it --name ubuvm04 -p 10.5.50.32:55555:55555 --expose 1186 ubuntu /bin/bash    

echo ">>>>> Please remember to change the IPs on the Config files of the db cluster <<<<<"

echo "Done!"
