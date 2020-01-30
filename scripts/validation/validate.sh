#!/bin/bash

fn=$1

JQ_WKTCHK='.  
| .summary.wkt = if (.coordinateSystem.wkt|length>1) then (.coordinateSystem.wkt | match("PROJCS\\[\"(.*)\"";"n").captures[0].string) else false end
| {pth:.files[0], wkt: (if .summary.wkt then (.summary.wkt | startswith("NZGD")) else false end)}
| select (.wkt | not) | .pth' 

gdalinfo -json $fn | jq -r "JQ_WKTCHK"