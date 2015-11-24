
echo ">>>>> launching cluster 1/3 <<<<<"
docker run -dt -it --name rab01 -p 10.5.50.20:11111:11111 rabbitmq:3 /bin/bash
echo ">>>>> launching cluster 2/3 <<<<<"
docker run -dt -it --name rab02 -p 10.5.50.20:22222:22222 rabbitmq:3 /bin/bash
echo ">>>>> launching cluster 3/3 <<<<<"
docker run -dt -it --name rab03 -p 10.5.50.20:33333:33333 rabbitmq:3 /bin/bash
