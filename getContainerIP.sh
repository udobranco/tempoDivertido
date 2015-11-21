#Add to bashrc (~/.bashrc) this lines and reload it (source ~/.bashrc)
#usage docker-ip YOUR_CONTAINER_ID
docker-ip() {
 docker inspect --format '{{ .NetworkSettings.IPAddress }}' "$@"
}
