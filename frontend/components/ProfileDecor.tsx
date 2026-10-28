function Swoosh() {
  return (
    <svg width="90" height="14" viewBox="0 0 90 14" fill="none" className="mt-1 text-sage" aria-hidden="true">
      <path d="M2 10C22 2 52 2 88 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Leaves({
  className,
  size = "w-[200px] h-[270px]",
  flip = false,
}: {
  className?: string;
  size?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className={`absolute text-graphite-45 opacity-30 ${size} ${flip ? "-scale-x-100" : ""} ${className ?? ""}`}
      viewBox="0 0 220 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <path d="M70 300C66 220 80 130 130 30" />
      <path d="M74 250c-26-8-42-28-46-54 28 2 44 20 46 54z" />
      <path d="M80 205c26-4 42-20 46-46-28 0-44 16-46 46z" />
      <path d="M88 160c-24-10-36-28-38-52 26 8 38 26 38 52z" />
      <path d="M98 118c22-6 36-22 38-46-24 2-38 18-38 46z" />
      <path d="M110 78c-14-10-20-24-20-40 16 6 22 20 20 40z" />
    </svg>
  );
}

function Quote({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute w-[120px] -rotate-6 text-graphite-70 ${className}`}
      style={{ fontFamily: '"Caveat", cursive' }}
    >
      <p className="text-[28px] font-semibold leading-[1.05]">{children}</p>
      <Swoosh />
    </div>
  );
}

/**
 * Decorative margin art for wide screens only (1500px and up). Sits behind
 * the page content (the content wrapper needs `relative z-10`) and never
 * takes clicks.
 */
export function ProfileDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-screen -translate-x-1/2 overflow-hidden min-[1500px]:block"
      aria-hidden="true"
    >
      {/* Left side: top, middle, bottom */}
      <Leaves className="left-0 top-[30px]" />
      <Leaves className="left-[30px] top-[36%]" size="w-[190px] h-[255px]" />
      <Leaves className="bottom-[30px] left-0" size="w-[220px] h-[300px]" />

      {/* Right side: mirrored */}
      <Leaves className="right-0 top-[24%]" flip />
      <Leaves className="right-[20px] top-[56%]" size="w-[190px] h-[255px]" flip />
      <Leaves className="bottom-[30px] right-0" size="w-[220px] h-[300px]" flip />

      {/* Quotes */}
      <Quote className="left-[60px] top-[26%]">
        Small habits,<br />big change
      </Quote>
      <Quote className="right-[38px] top-[46%]">
        Eat well,<br />live well
      </Quote>
      <Quote className="left-[64px] top-[60%]">
        Know your<br />numbers
      </Quote>
      <Quote className="bottom-[170px] right-[64px]">
        Fuel your<br />Potential
      </Quote>
    </div>
  );
}