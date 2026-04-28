declare module 'd3-color' {
  export interface Color {
    displayable(): boolean;
    toString(): string;
    formatHex(): string;
    formatHsl(): string;
    formatRgb(): string;
    hex(): string;
  }
  export function color(specifier: string): Color | null;
  export function rgb(r: number, g: number, b: number, opacity?: number): Color;
  export function hsl(h: number, s: number, l: number, opacity?: number): Color;
}
