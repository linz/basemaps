interface Named {
    name: string;
}

export function compareName(a: Named, b: Named): number {
    return a.name.localeCompare(b.name);
}
