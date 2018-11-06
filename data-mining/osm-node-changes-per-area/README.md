# osm-vis/osm-node-changes-per-area

The tool extracts the changes on nodes from [OSM replication diffs](https://planet.openstreetmap.org/replication/day/) and aggregates them by space and time.

## Installation

To install the tool, [Haskell](https://www.haskell.org/platform/) needs to be installed. Then execute:
```
mkdir osm-vis && cd osm-vis
wget https://github.com/mocnik-science/osm-vis/archive/master.zip
unzip master.zip
cd osm-vis/data-mining/osm-node-changes-per-area
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
