#!/usr/bin/env bash
#@ Usage: bash script.sh file.txt

set -euo pipefail

input=${1:-file.txt}
output=${2:-file.yaml}
> "$output"

while IFS= read -r zip && \
      IFS= read -r line2 && \
      IFS= read -r line3 && \
      IFS= read -r line4; do
  # skip empty blocks
  [[ -z $zip ]] && continue

  # normalize zipcode
  code=${zip}
  code=${code//-/}

  # fetch address info
  json=$(curl -s "https://digital-address.app/${code}")
  pref=$(jq -r '.addresses[0].pref_name' <<<"$json")
  city=$(jq -r '.addresses[0].city_name' <<<"$json")
  town=$(jq -r '.addresses[0].town_name' <<<"$json")

  # extract block vs building/room
  # block2: leftover after removing pref+city+town from line2
  block2=${line2#${pref}${city}${town}}

  if [[ $line3 =~ ^[0-9] ]]; then
    # line3 is block-room
    block=${line3%-*}
    room=${line3##*-}
    building=""
  else
    block=$block2
    if [[ $line3 =~ ^(.+?)([0-9]+)$ ]]; then
      building=${BASH_REMATCH[1]}
      room=${BASH_REMATCH[2]}
    else
      building=$line3
      room=""
    fi
  fi

  # recipient name & honorific
  if [[ $line4 =~ ^(.+?)(殿|様|御中)$ ]]; then
    name=${BASH_REMATCH[1]}
    honor=${BASH_REMATCH[2]}
  else
    name=$line4
    honor=""
  fi

  {
    echo "recipient:"
    echo "  name: \"$name\""
    echo "  honorific: \"$honor\""
    echo "address:"
    echo "  postal_code: \"$zip#〒\""
    echo "  prefecture: \"$pref\""
    echo "  city: \"$city\""
    echo "  locality: \"$town\""
    echo "  block: \"$block\""
    echo "  building: \"$building\""
    echo "  room: \"$room\""
    echo
  } >> "$output"

  # consume blank separator
  IFS= read -r _ || true
done < "$input"