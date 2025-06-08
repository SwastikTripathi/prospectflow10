import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="120"
      height="30"
      aria-label="ProspectFlow Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
          .logo-text {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            fill: url(#logoGradient);
          }
          .logo-tagline {
            font-family: 'PT Sans', sans-serif;
            font-size: 10px;
            fill: hsl(var(--foreground) / 0.7);
          }
        `}
      </style>
      <text x="5" y="30" className="logo-text">
        ProspectFlow
      </text>
      {/* <text x="10" y="45" className="logo-tagline">
        Streamline Your Outreach
      </text> */}
    </svg>
  );
}
