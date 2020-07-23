echo "Joining turn-restrictions.mbtiles with $1 to create osm-qa-with-tr.mbtiles file"

mason_packages/.link/bin/tile-join -pg -pk -f -o osm-qa-with-tr.mbtiles $1 turn-restrictions.mbtiles
