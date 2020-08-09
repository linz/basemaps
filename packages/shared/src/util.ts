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
