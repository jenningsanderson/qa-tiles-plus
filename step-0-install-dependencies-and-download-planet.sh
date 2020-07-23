echo "Running npm install"
npm install

echo "Installing mason to manage dependencies"
git clone --depth=1 https://github.com/mapbox/mason

echo "Installing tippecanoe"
mason/mason install tippecanoe 1.32.10
mason/mason link tippecanoe 1.32.10

echo "Downloading planet-latest.osm.pbf from a US mirror"
wget https://ftpmirror.your.org/pub/openstreetmap/pbf/planet-latest.osm.pbf
