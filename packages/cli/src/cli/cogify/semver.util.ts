/** major.minor.patch */
const MaxLength = 3;
/** fits into a int32 with out forcing a uint conversion */
const EncodeBits = 10;
/** Max size for a single semver number (1024) */
const MaxEncode = 2 ** EncodeBits - 1;

export const SemVer = {
    /**
     * Encode a semver string into a number
     * @example
     *  '0.0.1' => 1
     *  'v0.1.0' => 1024
     * @param v version to encode
     */
    toNumber(v: string): number {
        if (v.startsWith('v')) v = v.slice(1);
        const chunks = v.split('.');
        if (chunks.length > MaxLength) throw new Error(`Failed to parse semver "${v}" too long`);

        let output = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (chunk == '') break;

            const num = parseInt(chunk);
            if (isNaN(num)) throw new Error(`Failed to parse semver "${v}"`);
            if (num > MaxEncode) throw new Error(`Failed to parse semver "${v}" ${chunk} is too large`);

            output |= num << ((MaxLength - i - 1) * EncodeBits);
        }
        return output;
    },

    /**
     * Decoded a number encoded semver
     * @example 1 => '0.0.1'
     * @param v version to decode
     */
    fromNumber(v: number): string {
        const major = (v >> 20) & MaxEncode;
        const minor = (v >> 10) & MaxEncode;
        const patch = v & MaxEncode;
        return `${major}.${minor}.${patch}`;
    },

    /**
     * Compare two semver's
     * @param vA version A
     * @param vB version B
     * @returns 0 if equal, >0 if vA > vB, <0 otherwise
     */
    compare(vA: string, vB: string): number {
        return SemVer.toNumber(vA) - SemVer.toNumber(vB);
    },
};
