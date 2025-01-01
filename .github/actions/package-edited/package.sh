#!/bin/bash

outputFolder=_output
artifactsFolder=_artifacts
uiFolder="$outputFolder/UI"
framework="${FRAMEWORK:=net6.0}"

rm -rf $artifactsFolder
mkdir $artifactsFolder

for runtime in _output/*
do
  name="${runtime##*/}"
  folderName="$runtime/$framework"
  sonarrFolder="$folderName/Radarr"
  archiveName="Radarr.$BRANCH.$RADARR_VERSION.$name"

  if [[ "$name" == 'UI' ]]; then
    continue
  fi
    
  echo "Creating package for $name"

  echo "Copying UI"
  cp -r $uiFolder $sonarrFolder
  
  echo "Setting permissions"
  find $sonarrFolder -name "ffprobe" -exec chmod a+x {} \;
  find $sonarrFolder -name "Radarr" -exec chmod a+x {} \;
  find $sonarrFolder -name "Radarr.Update" -exec chmod a+x {} \;

  echo "Packaging Artifact"
  if [[ "$name" == *"linux"* ]] || [[ "$name" == *"osx"* ]] || [[ "$name" == *"freebsd"* ]]; then
    tar -zcf "./$artifactsFolder/$archiveName.tar.gz" -C $folderName Radarr
	fi
done
