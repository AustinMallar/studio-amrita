const links = [
  { href: "#overview", label: "Overview" },
  { href: "#orders", label: "Orders" },
  { href: "#addresses", label: "Addresses" },
  { href: "#profile", label: "Profile" },
  { href: "#password", label: "Password" },
] as const;

export function AccountSubNav() {
  return (
    <nav
      aria-label="Account sections"
      className="flex flex-wrap gap-2 border-b border-black/[0.06] pb-4 font-sans text-sm"
    >
      {links.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          className="rounded-full border border-black/[0.08] bg-white/60 px-4 py-2 font-medium text-heading transition hover:border-dusty-rose/50 hover:text-dusty-rose"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
