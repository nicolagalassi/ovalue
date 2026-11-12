import { describe, it, expect } from 'vitest';
import { isOlderVersion } from '../src/composables/exporterVersion.js';

describe('isOlderVersion', () => {
    it('confronta le versioni numericamente, non come stringhe', () => {
        expect(isOlderVersion('4.5.4', '4.6.0')).toBe(true);
        expect(isOlderVersion('4.9.0', '4.10.0')).toBe(true);
        expect(isOlderVersion('4.10.0', '4.9.0')).toBe(false);
        expect(isOlderVersion('3.9.0', '4.0.0')).toBe(true);
    });
    it('versioni uguali o più nuove non sono da aggiornare', () => {
        expect(isOlderVersion('4.6.0', '4.6.0')).toBe(false);
        expect(isOlderVersion('4.6.1', '4.6.0')).toBe(false);
    });
    it('parti mancanti valgono 0', () => {
        expect(isOlderVersion('4.6', '4.6.0')).toBe(false);
        expect(isOlderVersion('4.6', '4.6.1')).toBe(true);
    });
});
