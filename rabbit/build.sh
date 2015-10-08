#fetching no pam ubuntu image

printf "Step 1) pulling ubuntu image\n"
docker pull sequenceiq/pam:ubuntu-14.04
printf "Step 1) Terminated \n"

#deploy container 
printf "Step 2) Container deploy\n"
docker run -dt -it sequenceiq/pam:ubuntu-14.04
printf "Step 2) Terminated\n"

#installing rabbit mq
printf "Step 3) install rabbitmq press CRTL+PQ at end \n"
docker ps -a
read -p "Insert at least 3 ContainerID number " cID
docker attach "$cID"
printf "Step 3) Terminated\n"
