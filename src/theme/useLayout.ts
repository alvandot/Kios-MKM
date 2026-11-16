import { useWindowDimensions } from 'react-native';

/**
 * Breakpoint responsif: Sunmi V2 Pro (~360-400dp) = compact,
 * ponsel biasa = medium, tablet Samsung (>=720dp) = regular.
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const regular = width >= 720;

  return {
    compact,
    regular,
    // Jarak halaman & ukuran huruf mengecil di layar sempit
    pagePad: compact ? 16 : regular ? 36 : 24,
    heroSize: compact ? 26 : 34,
    sectionSize: compact ? 18 : 22,
    // Dashboard: jumlah kolom tile mengikuti lebar
    cols: width < 480 ? 2 : width < 900 ? 3 : 4,
    // Tab bar: label disembunyikan di layar sempit
    showTabLabels: !compact,
  };
}
