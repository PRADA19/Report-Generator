export interface PhotoLayoutRow {
  columns: number[]; // Width percentage of each column in this row (e.g. [100], [50, 50], [70, 30], [33.3, 33.3, 33.3], [25, 25, 25, 25])
  heightPx?: number; // Optional height override for photos in this row
}

export interface PhotoLayoutPreset {
  id: string;
  label: string;
  count: number;
  rows: PhotoLayoutRow[];
  cardHeightDefault?: number;
}

export const PHOTO_LAYOUT_PRESETS: PhotoLayoutPreset[] = [
  // ----------------------------------------------------
  // 1 PHOTO PRESETS
  // ----------------------------------------------------
  {
    id: 'single-hero',
    label: 'Large Centered',
    count: 1,
    rows: [
      { columns: [100], heightPx: 220 }
    ]
  },
  {
    id: 'single-compact',
    label: 'Compact Centered',
    count: 1,
    rows: [
      { columns: [60], heightPx: 160 }
    ]
  },

  // ----------------------------------------------------
  // 2 PHOTOS PRESETS
  // ----------------------------------------------------
  {
    id: 'two-vertical',
    label: 'Vertical Stack (1 / 1)',
    count: 2,
    rows: [
      { columns: [85], heightPx: 160 },
      { columns: [85], heightPx: 160 }
    ]
  },
  {
    id: 'two-side-by-side',
    label: 'Side-by-Side (1 | 1)',
    count: 2,
    rows: [
      { columns: [50, 50], heightPx: 180 }
    ]
  },
  {
    id: 'two-large-small',
    label: 'Large + Small (70:30)',
    count: 2,
    rows: [
      { columns: [70, 30], heightPx: 170 }
    ]
  },

  // ----------------------------------------------------
  // 3 PHOTOS PRESETS
  // ----------------------------------------------------
  {
    id: 'three-vertical',
    label: 'Vertical Stack (1 / 1 / 1)',
    count: 3,
    rows: [
      { columns: [80], heightPx: 140 },
      { columns: [80], heightPx: 140 },
      { columns: [80], heightPx: 140 }
    ]
  },
  {
    id: 'three-hero-two',
    label: 'One + Two (1 / 2)',
    count: 3,
    rows: [
      { columns: [100], heightPx: 180 },
      { columns: [50, 50], heightPx: 150 }
    ]
  },
  {
    id: 'three-two-one',
    label: 'Two + One (2 / 1)',
    count: 3,
    rows: [
      { columns: [50, 50], heightPx: 150 },
      { columns: [75], heightPx: 160 }
    ]
  },
  {
    id: 'three-column',
    label: '3 in One Row (1 | 1 | 1)',
    count: 3,
    rows: [
      { columns: [33.3, 33.3, 33.3], heightPx: 150 }
    ]
  },

  // ----------------------------------------------------
  // 4 PHOTOS PRESETS
  // ----------------------------------------------------
  {
    id: 'four-vertical',
    label: 'Vertical (1+1+1+1)',
    count: 4,
    rows: [
      { columns: [75], heightPx: 130 },
      { columns: [75], heightPx: 130 },
      { columns: [75], heightPx: 130 },
      { columns: [75], heightPx: 130 }
    ]
  },
  {
    id: 'four-grid-2x2',
    label: '2 × 2 Grid (2+2)',
    count: 4,
    rows: [
      { columns: [50, 50], heightPx: 145 },
      { columns: [50, 50], heightPx: 145 }
    ]
  },
  {
    id: 'four-one-three',
    label: '1 + 3 Hero',
    count: 4,
    rows: [
      { columns: [100], heightPx: 170 },
      { columns: [33.3, 33.3, 33.3], heightPx: 135 }
    ]
  },
  {
    id: 'four-three-one',
    label: '3 + 1 Grid',
    count: 4,
    rows: [
      { columns: [33.3, 33.3, 33.3], heightPx: 135 },
      { columns: [75], heightPx: 160 }
    ]
  },
  {
    id: 'four-column',
    label: '4 in One Row',
    count: 4,
    rows: [
      { columns: [25, 25, 25, 25], heightPx: 130 }
    ]
  },

  // ----------------------------------------------------
  // 5 PHOTOS PRESETS
  // ----------------------------------------------------
  {
    id: 'five-vertical',
    label: 'Vertical Stack (1x5)',
    count: 5,
    rows: [
      { columns: [75], heightPx: 120 },
      { columns: [75], heightPx: 120 },
      { columns: [75], heightPx: 120 },
      { columns: [75], heightPx: 120 },
      { columns: [75], heightPx: 120 }
    ]
  },
  {
    id: 'five-three-two',
    label: '3 + 2 Grid',
    count: 5,
    rows: [
      { columns: [33.3, 33.3, 33.3], heightPx: 135 },
      { columns: [50, 50], heightPx: 135 }
    ]
  },
  {
    id: 'five-two-three',
    label: '2 + 3 Grid',
    count: 5,
    rows: [
      { columns: [50, 50], heightPx: 135 },
      { columns: [33.3, 33.3, 33.3], heightPx: 135 }
    ]
  },
  {
    id: 'five-grid',
    label: '1 + 2 + 2 Grid',
    count: 5,
    rows: [
      { columns: [100], heightPx: 160 },
      { columns: [50, 50], heightPx: 135 },
      { columns: [50, 50], heightPx: 135 }
    ]
  },
  {
    id: 'five-two-two-one',
    label: '2 + 2 + 1 Grid',
    count: 5,
    rows: [
      { columns: [50, 50], heightPx: 135 },
      { columns: [50, 50], heightPx: 135 },
      { columns: [75], heightPx: 140 }
    ]
  },

  // ----------------------------------------------------
  // 6 PHOTOS PRESETS
  // ----------------------------------------------------
  {
    id: 'six-vertical',
    label: 'Vertical Stack (1x6)',
    count: 6,
    rows: [
      { columns: [75], heightPx: 115 },
      { columns: [75], heightPx: 115 },
      { columns: [75], heightPx: 115 },
      { columns: [75], heightPx: 115 },
      { columns: [75], heightPx: 115 },
      { columns: [75], heightPx: 115 }
    ]
  },
  {
    id: 'six-three-three',
    label: '3 + 3 Grid',
    count: 6,
    rows: [
      { columns: [33.3, 33.3, 33.3], heightPx: 130 },
      { columns: [33.3, 33.3, 33.3], heightPx: 130 }
    ]
  },
  {
    id: 'six-two-three-rows',
    label: '2 + 2 + 2 Grid',
    count: 6,
    rows: [
      { columns: [50, 50], heightPx: 130 },
      { columns: [50, 50], heightPx: 130 },
      { columns: [50, 50], heightPx: 130 }
    ]
  },
  {
    id: 'six-grid-1-2-3',
    label: '1 + 2 + 3 Grid',
    count: 6,
    rows: [
      { columns: [100], heightPx: 150 },
      { columns: [50, 50], heightPx: 130 },
      { columns: [33.3, 33.3, 33.3], heightPx: 125 }
    ]
  },
  {
    id: 'six-grid-2-3-1',
    label: '2 + 3 + 1 Grid',
    count: 6,
    rows: [
      { columns: [50, 50], heightPx: 130 },
      { columns: [33.3, 33.3, 33.3], heightPx: 125 },
      { columns: [75], heightPx: 135 }
    ]
  }
];

export function getPresetsForCount(count: number): PhotoLayoutPreset[] {
  if (count <= 0) return [];
  if (count <= 6) {
    return PHOTO_LAYOUT_PRESETS.filter(p => p.count === count);
  }

  // Scalable layout presets for 7+ photos
  return [
    {
      id: `fallback-grid-${count}`,
      label: `${count} Photos (3-Col Grid)`,
      count,
      rows: Array.from({ length: Math.ceil(count / 3) }, (_, i) => {
        const remaining = count - i * 3;
        const rowCols = Math.min(3, remaining);
        const colWidth = 100 / rowCols;
        return {
          columns: Array(rowCols).fill(colWidth),
          heightPx: 125
        };
      })
    },
    {
      id: `fallback-grid-2col-${count}`,
      label: `${count} Photos (2-Col Grid)`,
      count,
      rows: Array.from({ length: Math.ceil(count / 2) }, (_, i) => {
        const remaining = count - i * 2;
        const rowCols = Math.min(2, remaining);
        const colWidth = 100 / rowCols;
        return {
          columns: Array(rowCols).fill(colWidth),
          heightPx: 130
        };
      })
    },
    {
      id: `fallback-vertical-${count}`,
      label: `${count} Photos (Vertical)`,
      count,
      rows: Array.from({ length: count }, () => ({
        columns: [75],
        heightPx: 120
      }))
    }
  ];
}

export function getPresetById(id?: string, count: number = 1): PhotoLayoutPreset {
  const available = getPresetsForCount(count);
  if (id) {
    const match = available.find(p => p.id === id);
    if (match) return match;
  }
  return available[0] || PHOTO_LAYOUT_PRESETS[0];
}
