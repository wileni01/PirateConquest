import React, { useMemo } from 'react';
// Note: Vite can import JSON statically. Adjust path if needed.
// @ts-expect-error geojson import
import land from '@/public/caribbean-landmasses.geojson';
import { CARIBBEAN_PORTS } from '../../data/ports.caribbean';
import { VIEWBOX, projectLatLonXY } from '../lib/geo';

export function CaribbeanMap() {
  const landPaths = useMemo(() => {
    const paths: string[] = [];
    const featureCollection: any = land as any;
    if (!featureCollection?.features) return paths;
    for (const f of featureCollection.features) {
      const geom = f?.geometry;
      if (!geom) continue;
      const rings: number[][][] =
        geom.type === 'Polygon' ? geom.coordinates :
        geom.type === 'MultiPolygon' ? (geom.coordinates as number[][][][]).flat() : [] as any;
      for (const ring of rings) {
        if (!Array.isArray(ring)) continue;
        let d = '';
        ring.forEach(([lon, lat]: [number, number], i: number) => {
          const { x, y } = projectLatLonXY(lat, lon);
          d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
        d += ' Z';
        paths.push(d);
      }
    }
    return paths;
  }, []);

  const cities = useMemo(() => {
    return CARIBBEAN_PORTS.map((p) => {
      const { x, y } = projectLatLonXY(p.lat, p.lon);
      return { ...p, x, y };
    });
  }, []);

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="caribbean-svg"
        aria-label="Caribbean Map"
      >
        <g className="land">
          {landPaths.map((d, i) => (
            <path key={i} d={d} fill="#CABF9F" stroke="#5E5238" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g className="cities">
          {cities.map((c) => (
            <g key={c.name} transform={`translate(${c.x}, ${c.y})`}>
              <circle r={5} fill="#1E90FF" stroke="#0F3D66" vectorEffect="non-scaling-stroke" />
              <text
                x={8}
                y={-8}
                fontSize={12}
                stroke="white"
                strokeWidth={3}
                paintOrder="stroke"
                style={{ userSelect: 'none' }}
              >
                {c.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default CaribbeanMap;


