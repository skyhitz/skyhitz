// Shim for react-native-svg in web context
import React from 'react';

// Create base SVG component
const Svg = ({ width, height, viewBox, children, style, ...props }) => (
  <svg 
    width={width} 
    height={height} 
    viewBox={viewBox} 
    style={style} 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {children}
  </svg>
);

// Create SVG elements
const Path = ({ d, fill, stroke, strokeWidth, ...props }) => (
  <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />
);

const ClipPath = ({ id, children, ...props }) => (
  <clipPath id={id} {...props}>{children}</clipPath>
);

const Defs = props => <defs {...props} />;

const LinearGradient = ({ id, gradientUnits, x1, y1, x2, y2, children, ...props }) => (
  <linearGradient id={id} gradientUnits={gradientUnits} x1={x1} y1={y1} x2={x2} y2={y2} {...props}>
    {children}
  </linearGradient>
);

const Stop = ({ offset, stopColor, stopOpacity, ...props }) => (
  <stop offset={offset} stopColor={stopColor} stopOpacity={stopOpacity} {...props} />
);

const ForeignObject = ({ width, height, x, y, transform, clipPath, children, ...props }) => (
  <foreignObject width={width} height={height} x={x} y={y} transform={transform} clipPath={clipPath} {...props}>
    {children}
  </foreignObject>
);

const G = props => <g {...props} />;

const Circle = ({ cx, cy, r, fill, ...props }) => (
  <circle cx={cx} cy={cy} r={r} fill={fill} {...props} />
);

const Rect = ({ x, y, width, height, fill, ...props }) => (
  <rect x={x} y={y} width={width} height={height} fill={fill} {...props} />
);

const Line = ({ x1, y1, x2, y2, stroke, strokeWidth, ...props }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeWidth} {...props} />
);

const Polygon = ({ points, fill, ...props }) => (
  <polygon points={points} fill={fill} {...props} />
);

const Polyline = ({ points, fill, stroke, ...props }) => (
  <polyline points={points} fill={fill} stroke={stroke} {...props} />
);

const Text = ({ x, y, fontSize, fontWeight, fill, ...props }) => (
  <text x={x} y={y} fontSize={fontSize} fontWeight={fontWeight} fill={fill} {...props} />
);

// Export components
export default Svg;
export {
  Path,
  ClipPath,
  Defs,
  LinearGradient,
  Stop,
  ForeignObject,
  G,
  Circle,
  Rect,
  Line,
  Polygon,
  Polyline,
  Text,
};

// Export SVG utilities
export const createSvgComponent = (name) => {
  return ({ children, ...props }) => React.createElement(name, props, children);
};

// Export SVG constants
export const SvgCss = {
  toString: () => '',
};
