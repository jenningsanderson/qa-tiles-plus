# OSM-QA-Tiles+

Some scripts to automate the extraction of turn restrictions (and more?) from the planet pbf file and then join with the latest osm-qa-tiles.

Originally from this gist: https://gist.github.com/jenningsanderson/b04ac2cc68a2cf79a4c4cb2c1b16c96d

### Running
Each script is numbered to run in order. First, `wget` the latest planet file and the osm-qa-tiles:

    $ wget https://planet.openstreetmap.org/pbf/planet-latest.osm.pbf
    $ wget https://s3.amazonaws.com/mapbox/osm-qa-tiles-production/latest.planet.mbtiles.gz
    
Then, filter the planet file for relevant restrictions (~ 10 minutes ):
    
    $ ./step-1-osmium-tags-filter.sh  
    
Now run the `extract` script to turn turn-restrictions into GeoJSON (~ 1 minute ): 
    
    $ ./step-2-convert-geometries.sh
    
Run tippecanoe to create the turn restrictions mbtiles file ( ~ 2 minutes ):

    $ ./step-3-tile.sh
    
Finally, run tile-join to join the turn restriction tiles with osm-qa-tiles, this can take some time.
    
    $ ./step-4-tile-join.sh
    
Ultimately, you'll get this file: `osm-qa-with-tr.mbtiles` Now you can feed this into tile-reduce for further analysis.
