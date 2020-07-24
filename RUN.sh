./step-0-install-dependencies-and-download-planet.sh 

./step-1-osmium-tags-filter.sh planet-latest.osm.pbf

./step-2-convert-geometries.sh

rm planet-latest.osm.pbf

./step-3-tile.sh

./step-4-download-qa-tiles.sh

./step-5-tile-join.sh latest.planet.mbtiles

rm latest.planet.mbtiles
