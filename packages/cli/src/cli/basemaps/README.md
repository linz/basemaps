# Basemaps Configuration utility

This tool is designed to configure the basemaps rendering engine priority.

### Tile Sets

To render a basemap, a collection of imagery needs to be configured, basemaps uses a 'TileSet' for this configuration.

A tile set is a list of imagery along with the zoom levels to render at and the priority for rendering. The higher the number, the later the imagery will be layered onto the canvas. So bigger number means it will be on top when viewed.

The entire history of the tile set is stored inside the metadata database and version tags are used to configure what is rendered to the user

Common tags:

-   `head` - The most recent tile set configuration
-   `production` - The tile set configuration which is rendered by default to the user

## Info

To retrieve information about a tile set,

_This by default will show the current version_

To see a specific version use `-v :versionNumber`

```
./basemaps info -n aerial -p 3857

TileSet: aerial
CreatedAt: Wed Apr 29 2020 12:32:46 GMT+1200 (New Zealand Standard Time)
UpdatedAt: Wed Apr 29 2020 12:48:20 GMT+1200 (New Zealand Standard Time)
Version: v3 (3)
Imagery:
#   	Id                            	Name                                    	Zoom
1   	im_01DYE4EGR92TNMV16AHXSR45JH	gebco                                   	0 -> 15
2   	im_01E4PN40AEH10EH128AG28YSDM	new_zealand_sentinel_2018-19_10m        	0 -> 32
3   	im_01E3N4FQ7CKMS59BHBFY5RS0PN	northland_rural_2014-16_0-4m            	13 -> 32
4   	im_01E3NFVEFRE332V08RP2YBNQSX	west-coast_rural_2015-16_0-3m           	13 -> 32
...
```

## Log

To see a history of changes for a tile set as well as what version each tag is assigned to

```
./basemaps log -n aerial -p 3857

TileSet: aerial
CreatedAt: Wed Apr 29 2020 12:32:46 GMT+1200 (New Zealand Standard Time)
UpdatedAt: Wed Apr 29 2020 12:48:20 GMT+1200 (New Zealand Standard Time)
Version: v3 (3)
History:
v   	CreatedAt                               	Tags
v3  	2020-04-29T00:32:46.514Z                	head
v2  	2020-04-29T00:32:46.514Z
v1  	2020-04-29T00:32:46.514Z
v0  	2020-04-29T00:32:46.514Z                	production
...
```

## Tag

To change the version a tag is using

```
# Update tag production to v3

./basemaps tag -n aerial -p 3857 -t production -v 3 --commit
```

## Updating

To update command can be used to configure the rendering of a tile set, each time the `--commit` is used a new version is created and the `head` tag is updated to point at it.

```
# Make gebco priority 2
./basemaps update -n aerial -p 3857 -i im_01DYE4EGR92TNMV16AHXSR45JH --priority 2 --commit

# Remove gebco from rendering
./basemaps update -n aerial -p 3857 -i im_01DYE4EGR92TNMV16AHXSR45JH --priority -1 --commit

# Change zoom levels gebco is rendered at
./basemaps update -n aerial -p 3857 -i im_01DYE4EGR92TNMV16AHXSR45JH --max-zoom 5 --min-zoom 2 --commit
```

To cause the production rendering to be updated the `production` tag will need to be set to the new version after the version is validated.
