export function b64decode(base64: string) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

export function b64decodeText(base64: string) {
  const bytes = b64decode(base64);
  return new TextDecoder().decode(bytes);
}

export function b64urlDecode(base64url: string) {
  const base64 = base64url.replace(
    /[-_]/g,
    (m) =>
      ({
        '-': '+',
        _: '/',
      }[m] || ''),
  );
  return b64decode(base64);
}

export function b64encode(bytes: Uint8Array) {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('');
  return btoa(binString);
}

export function b64encodeText(text: string) {
  const bytes = new TextEncoder().encode(text);
  return b64encode(bytes);
}

export function b64urlEncode(bytes: Uint8Array) {
  const base64 = b64encode(bytes);
  return base64.replace(
    /[+/=]/g,
    (m) =>
      ({
        '+': '-',
        '/': '_',
      }[m] || ''),
  );
}
