echo "Launching a 5 node MySql db cluster"

echo "Launching Management Node (1/5)"
docker run -dt -it --name CENVM00 -p 10.5.50.32:11111:11111 centos /bin/bash    
echo "Launching 1st SQL Node (2/5)"
docker run -dt -it --name CENVM01 -p 10.5.50.32:22222:22222 centos /bin/bash    
echo "Launching 2nd SQL Node (1/5)"
docker run -dt -it --name CENVM02 -p 10.5.50.32:33333:33333 centos /bin/bash    
echo "Launching 1st Data Node 4/5)"
docker run -dt -it --name CENVM03 -p 10.5.50.32:44444:44444 centos /bin/bash    
echo "Launching 2nd Data Node (5/5)"
docker run -dt -it --name CENVM04 -p 10.5.50.32:55555:55555 centos /bin/bash    

echo "Done!"
