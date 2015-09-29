sudo docker rm -f $(docker ps -aq)
sudo docker rmi $(docker images -aq)
