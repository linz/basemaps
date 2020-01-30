#!/bin/bash

fn=$1

JQ_FULL='.  
| .summary.wkt = if (.coordinateSystem.wkt|length>1) then (.coordinateSystem.wkt | match("PROJCS\\[\"(.*)\"";"n").captures[0].string) else false end
| .summary.wgs = if (.wgs84Extent|length>1) then {north:([.wgs84Extent.coordinates[][][1]] | max), south:([.wgs84Extent.coordinates[][][1]] | min), east:([.wgs84Extent.coordinates[][][0]] | max), west:([.wgs84Extent.coordinates[][][0]] | min), type:.wgs84Extent.type, p1:.wgs84Extent.coordinates[0][0], p4:.wgs84Extent.coordinates[0][4]} else false end
| .summary.ccx = if (.cornerCoordinates|length>1) then {north:.cornerCoordinates.upperLeft[1], south:.cornerCoordinates.lowerRight[1], east:.cornerCoordinates.lowerRight[0], west:.cornerCoordinates.upperLeft[0]} else false end
| .summary.ext = if (.extent|length>1) then {type:.extent.type} else {type:false} end
| .summary.rgb = if (.bands|length>1) then [.bands[].colorInterpretation] else false end
| {pth:.files[0],
rgb: (if .summary.rgb then (.summary.rgb | contains(["Red"]) and contains(["Blue"]) and contains(["Green"])) else false end), 
wkt: (if .summary.wkt then (.summary.wkt | startswith("NZGD")) else false end), 
wgs: (if .summary.wgs 
    then {
        type: (.summary.wgs.type=="Polygon"),
        p1p4: (.summary.wgs.p1==.summary.wgs.p4),
        nsew: (.summary.wgs.north<-30 and .summary.wgs.south>-50 and .summary.wgs.east<180 and .summary.wgs.west>160) 
    } else {type:false,p1p4:false,nsew:false} end),
ccx: (if .summary.ccx 
    then {   
        type: (if .summary.ext.type then .summary.ext.type=="Polygon" else false end),
        p1p4: true,
        nsew: (.summary.ccx.north<6000000 and .summary.ccx.south>4500000 and .summary.ccx.east<2000000 and .summary.ccx.west>1000000)
    } else {type:false,p1p4:false,nsew:false} end)
}
| {f:.pth, r:{"bound": (.wgs.nsew or .ccx.nsew), "closed": (.wgs.p1p4 or .ccx.p1p4), "poly":(.wgs.type or .ccx.type), "rgb":.rgb, "proj":.wkt }}
| select(.r | all | not) | .pth'

JQ_WKTCHK='.  
| .summary.wkt = if (.coordinateSystem.wkt|length>1) then (.coordinateSystem.wkt | match("PROJCS\\[\"(.*)\"";"n").captures[0].string) else false end
| {pth:.files[0], wkt: (if .summary.wkt then (.summary.wkt | startswith("NZGD")) else false end)}
| select (.wkt | not) | .pth' 

gdalinfo -json $fn | jq -r "JQ_WKTCHK"