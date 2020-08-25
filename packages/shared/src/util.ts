interface Named {
    name: string;
}

export function compareName(a: Named, b: Named): number {
    return a.name.localeCompare(b.name);
}

/**
 * Make a tile imagery name nicer to display as a Title
 * @example
 *  'tasman_rural_2018-19_0-3m' => 'Tasman rural 2018-19 0.3m'
 */
export function titleizeImageryName(name: string): string {
    return name[0].toUpperCase() + name.slice(1).replace(/_0-/g, ' 0.').replace(/_/g, ' ');
}

/**
 * Attempt to parse a year from a imagery name
 * @example wellington_urban_2017_0.10m -> 2017
 * @param name Imagery name to parse
 * @return imagery year, -1 for failure to parse
 */
export function extractYearRangeFromName(name: string): [number, number] {
    const re = /(?:^|\D)(\d{4})(?:-(\d{2}))?(?:$|\D)/g;

    const years: number[] = [];

    for (let m = re.exec(name); m != null; m = re.exec(name)) {
        years.push(parseInt(m[1]));
        if (m[2] != null) years.push(parseInt(m[1].slice(0, 2) + m[2]));
    }

    if (years.length == 0) {
        return [-1, -1];
    }

    years.sort();

    return [years[0], years[years.length - 1] + 1];
}
