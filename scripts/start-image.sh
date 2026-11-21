#!/bin/bash

#
# local container test
# Assumes project is located in ~/projects/dt3rmind
#

cd ~/projects/dt3rmind/
docker run -d --name dt3rmind-local --platform linux/arm64 --network host -e APP_PORT=8080 dt3rmind:release

###
### Useful commands
###
# View logs
# docker logs -f dt3rmind-local
#
# Stop container and remove
# docker rm -f dt3rmind-local
###
###
