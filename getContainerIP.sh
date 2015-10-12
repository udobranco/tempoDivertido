#Add to bashrc this lines and reload it
docker-ip() {
 docker inspect --format '{{ .NetworkSettings.IPAddress }}' "$@"
}
