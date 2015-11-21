#Add to bashrc (~/.bashrc) this lines and reload it (source ~/.bashrc)
docker-ip() {
 docker inspect --format '{{ .NetworkSettings.IPAddress }}' "$@"
}
