interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 32, className = '' }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B4332" />
          <stop offset="100%" stopColor="#359665" />
        </linearGradient>
      </defs>
      
      {/* Butterfly wing shape representing transformation */}
      <path
        d="M16 2C10 4 8 8 8 12C8 16 10 20 16 18C22 20 24 16 24 12C24 8 22 4 16 2Z"
        fill="url(#logoGradient)"
      />
      <path
        d="M16 18C10 20 8 24 8 28C8 30 10 30 12 28C14 26 16 24 16 18Z"
        fill="url(#logoGradient)"
        opacity="0.8"
      />
      <path
        d="M16 18C22 20 24 24 24 28C24 30 22 30 20 28C18 26 16 24 16 18Z"
        fill="url(#logoGradient)"
        opacity="0.8"
      />
      
      {/* Center body */}
      <circle cx="16" cy="16" r="2" fill="#1B4332" />
    </svg>
  );
};
