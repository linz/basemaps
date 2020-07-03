/**
 * Well known text for NZGD2000 / Chatham Islands TM 2000
 *
 * @see https://epsg.io/3793
 */
export const Citm2000 = `PROJCS["NZGD2000 / Chatham Islands TM 2000",
GEOGCS["NZGD2000",
    DATUM["New_Zealand_Geodetic_Datum_2000",
        SPHEROID["GRS 1980",6378137,298.257222101,
            AUTHORITY["EPSG","7019"]],
        TOWGS84[0,0,0,0,0,0,0],
        AUTHORITY["EPSG","6167"]],
    PRIMEM["Greenwich",0,
        AUTHORITY["EPSG","8901"]],
    UNIT["degree",0.01745329251994328,
        AUTHORITY["EPSG","9122"]],
    AUTHORITY["EPSG","4167"]],
    UNIT["metre",1,
        AUTHORITY["EPSG","9001"]],
PROJECTION["Transverse_Mercator"],
PARAMETER["latitude_of_origin",0],
PARAMETER["central_meridian",-176.5],
PARAMETER["scale_factor",1],
PARAMETER["false_easting",3500000],
PARAMETER["false_northing",10000000],
AUTHORITY["EPSG","3793"],
AXIS["Easting",EAST],
AXIS["Northing",NORTH]]`;
