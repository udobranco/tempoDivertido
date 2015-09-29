#!/bin/sh
docker run -dt -v /home/udobranco/tempodivertido:/opt/app -it devops-node python /opt/app/pySocketCli.py 0
docker run -dt -v /home/udobranco/tempodivertido:/opt/app -it devops-node python /opt/app/pySocketCli2.py 1
docker run -dt -v /home/udobranco/tempodivertido:/opt/app -it devops-node python /opt/app/pySocketCli.py 2
docker run -dt -v /home/udobranco/tempodivertido:/opt/app -it devops-node python /opt/app/pySocketCli2.py 3
docker run -dt -v /home/udobranco/tempodivertido:/opt/app -it devops-node python /opt/app/pySocketCli.py 4

