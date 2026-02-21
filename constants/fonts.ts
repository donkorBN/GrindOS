/**
 * Font utility — maps fontWeight values to Inter font family names.
 * Usage: fontFamily: fonts.bold  → 'Inter_700Bold'
 */
export const fonts = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
} as const;

/**
 * Map a numeric fontWeight to the correct Inter variant.
 * On Android, fontWeight + fontFamily conflict — you must use the named variant directly.
 */
export function fontForWeight(weight: string | number | undefined): string {
    switch (String(weight)) {
        case '800':
        case '900':
            return fonts.extrabold;
        case '700':
            return fonts.bold;
        case '600':
            return fonts.semibold;
        case '500':
            return fonts.medium;
        default:
            return fonts.regular;
    }
}
