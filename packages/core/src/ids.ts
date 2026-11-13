function utf8(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000)
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
  }
  return bytes;
}

const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));

function sha1(bytes: readonly number[]): number[] {
  const words = new Uint32Array((((bytes.length + 8) >> 6) + 1) * 16);
  bytes.forEach((byte, i) => {
    words[i >> 2] = (words[i >> 2] ?? 0) | (byte << (24 - (i % 4) * 8));
  });
  const end = bytes.length;
  words[end >> 2] = (words[end >> 2] ?? 0) | (0x80 << (24 - (end % 4) * 8));
  words[words.length - 1] = end * 8;

  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const w = new Uint32Array(80);
  for (let block = 0; block < words.length; block += 16) {
    for (let t = 0; t < 80; t++) {
      w[t] = t < 16 ? words[block + t]! : rotl(w[t - 3]! ^ w[t - 8]! ^ w[t - 14]! ^ w[t - 16]!, 1);
    }
    let [a, b, c, d, e] = h as [number, number, number, number, number];
    for (let t = 0; t < 80; t++) {
      const f =
        t < 20 ? (b & c) | (~b & d) : t < 40 || t >= 60 ? b ^ c ^ d : (b & c) | (b & d) | (c & d);
      const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6;
      const next = (rotl(a, 5) + f + e + k + w[t]!) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30) >>> 0;
      b = a;
      a = next;
    }
    [a, b, c, d, e].forEach((value, i) => (h[i] = (h[i]! + value) >>> 0));
  }
  return h.flatMap((word) => [word >>> 24, (word >>> 16) & 255, (word >>> 8) & 255, word & 255]);
}

/** RFC 9562 version 5: the same name in the same namespace always gives the same UUID. */
export function uuidV5(name: string, namespace: string): string {
  const ns = namespace
    .replaceAll("-", "")
    .match(/../g)!
    .map((pair) => parseInt(pair, 16));
  const bytes = sha1([...ns, ...utf8(name)]).slice(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
