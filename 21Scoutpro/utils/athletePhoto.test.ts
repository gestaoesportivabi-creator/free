import { describe, expect, it } from 'vitest';
import { athleteInitials, athletePhotoSrc } from './athletePhoto';

describe('athletePhotoSrc', () => {
  it('rejeita vazio, null e path de storage sem URL pública', () => {
    expect(athletePhotoSrc(undefined)).toBeNull();
    expect(athletePhotoSrc(null)).toBeNull();
    expect(athletePhotoSrc('')).toBeNull();
    expect(athletePhotoSrc('   ')).toBeNull();
    expect(athletePhotoSrc('null')).toBeNull();
    expect(athletePhotoSrc('undefined')).toBeNull();
    expect(athletePhotoSrc('avatars/jose2.png')).toBeNull();
    expect(athletePhotoSrc('equipe/time-qa/foto.jpg')).toBeNull();
  });

  it('aceita data URL, http(s) e path absoluto do próprio site', () => {
    const data = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    expect(athletePhotoSrc(data)).toBe(data);
    expect(athletePhotoSrc('  https://cdn.exemplo/foto.jpg  ')).toBe('https://cdn.exemplo/foto.jpg');
    expect(athletePhotoSrc('http://localhost/foto.png')).toBe('http://localhost/foto.png');
    expect(athletePhotoSrc('/uploads/foto.png')).toBe('/uploads/foto.png');
  });

  it('rejeita data URL truncada', () => {
    expect(athletePhotoSrc('data:image/jpeg;base64,')).toBeNull();
    expect(athletePhotoSrc('data:image/png;base64,abc')).toBeNull();
  });
});

describe('athleteInitials', () => {
  it('usa as duas primeiras letras, como no Scout Coletivo', () => {
    expect(athleteInitials('Jose Silva')).toBe('JO');
    expect(athleteInitials('qa')).toBe('QA');
    expect(athleteInitials('  Ana  ')).toBe('AN');
    expect(athleteInitials('')).toBe('??');
    expect(athleteInitials(null)).toBe('??');
  });
});
