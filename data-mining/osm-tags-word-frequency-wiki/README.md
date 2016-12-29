# osm-vis/osm-tags-word-frequency-wiki

The tool extracts the word frequency in the descriptions of OSM tags from the (OSM wiki)[https://wiki.openstreetmap.org/wiki/Map_Features].

## Installation

To install the tool, [Haskell](https://www.haskell.org/platform/) needs to be installed. Then execute:
```
mkdir osm-vis && cd osm-vis
wget https://github.com/mocnik-science/osm-vis/archive/master.zip
unzip master.zip
cd osm-vis/data-mining/osm-tags-word-frequency-wiki
cabal sandbox init
cabal update
cabal install
```

## Usage

To fetch and process the data, execute:
```
cabal run
```

## Author

This application is written and maintained by Franz-Benjamin Mocnik, <mail@mocnik-science.net>.

(c) by Franz-Benjamin Mocnik, 2016.

The code is licensed under the [GPL-3](http://github.com/mocnik-science/osm-vis/blob/master/LICENSE.md).
