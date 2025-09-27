#!/usr/bin/env bash
set -eu

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
currentDir=`pwd`

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --no-use  # This loads nvm


mybanner ()
{
  echo "+------------------------------------------+"
  printf "| %-40s |\n" "`date`"
  echo "|                                          |"
  printf "|`tput bold` %-40s `tput sgr0`|\n" "$@"
  echo "+------------------------------------------+"
}

install_backend () {
  mybanner "Installing backend"
  cd ${scriptDir}/backend
  nvm use
  yarn install
  yarn build
}

install_ui () {
  mybanner "Installing ui"
  cd ${scriptDir}/ui
  nvm use
  yarn install && yarn build
}

start=`date +%s`
install_backend
install_ui
end=`date +%s`
runtime=$((end-start))
mybanner "Packages installed and built in: ${runtime} seconds"
