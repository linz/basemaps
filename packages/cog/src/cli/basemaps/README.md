# Basemaps Configuration utility

This tool is designed to configure the basemaps rendering engine prority.

### TileSets

To render a basemap, a collection of imagery needs to be configured, basemaps uses a 'TileSet' for this configuration.

A tileset is a list of imgagery along with the zoom levels to render at and the priority for rendering. The higher the number, the later the imagery will be layered onto the canvas. So bigger number means it will be ontop when viewed.

The entire history of the tileset is stored inside the metadata database and version tags are used to configure what is rendered to the user

Common tags:

-   Head - The most recent tile set configuration
-   Production - The tile set configuration which is rendered by default to the user

## Info

To retrieve information about a tile set, use `info`

This will dump the current version

```
./basemaps info -n tags -p 3857

TileSet: tags
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

To see a history of changes for a tileset as well as what version each tag is assigned to

```
./basemaps log -n tags -p 3857

TileSet: tags
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

./basemaps tag -n tags -p 3857 -t production -v 3 --commit
```
