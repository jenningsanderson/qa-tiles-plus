# OSM-QA-Tiles+

Add representations of turn-restrictions to [osm-qa-tiles](//github.com/osmlab/osm-qa-tiles). 

### Running 

The `RUN.sh` script will do everything that is needed.

### Running Individually: 
Each script is numbered to run in order:
    
    $ ./step-0-install-dependencies-and-download-planet.sh 

Then, filter the planet file for relevant restrictions (~ 10 minutes ):
    
    $ ./step-1-osmium-tags-filter.sh  <latest planet.osm.pbf>
    
Now run the `extract` script to turn turn-restrictions into GeoJSON (~ 1 minute ): 
    
    $ ./step-2-convert-geometries.sh
    
Run tippecanoe to create the turn restrictions mbtiles file ( ~ 2 minutes ):

    $ ./step-3-tile.sh
    
Now get the latest osm-qa-tiles

    $ ./step-4-download-qa-tiles.sh
    
Finally, run tile-join to join the turn restriction tiles with osm-qa-tiles, this can take some time.
    
    $ ./step-5-tile-join.sh <latest planet.mbtiles>
    
Ultimately, the file `osm-qa-with-tr.mbtiles` is created. This is easily fed into tile-reduce for further analysis.


### Acknowledgements
An improved, all-in-one version of [this gist](https://gist.github.com/jenningsanderson/b04ac2cc68a2cf79a4c4cb2c1b16c96d) incorporating the feedback in the comments
