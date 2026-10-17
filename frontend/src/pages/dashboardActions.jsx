// Icons --------------------------------------------------------------
const Icon = ({ children }) => (
  <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
    {children}
  </svg>
);

const icons = {
  newLoan: (
    <Icon>
      <rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4M8 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Icon>
  ),
  search: (
    <Icon>
      <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  ),
  payment: (
    <Icon>
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="12" width="4" height="2" rx=".5" fill="currentColor" />
    </Icon>
  ),
  renewal: (
    <Icon>
      <path d="M4 10a6 6 0 1110.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 3.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),
  topUp: (
    <Icon>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Icon>
  ),
  summary: (
    <Icon>
      <path d="M4 14L7 9l4 3 5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),
};

// Color themes -------------------------------------------------------
// Each theme drives the card gradient, border, shadow and icon badge.
const themes = {
  red:    { icon: "#8F0000", iconBg: "#FFF0F0", iconBorder: "#F0CECE", border: "#E7CACA", gradientEnd: "#FFF8F8", shadow: "rgba(100, 0, 0, 0.06)" },
  indigo: { icon: "#4338CA", iconBg: "#EEF2FF", iconBorder: "#D9DCFF", border: "#D5D8F5", gradientEnd: "#F8F8FF", shadow: "rgba(67, 56, 202, 0.05)" },
  green:  { icon: "#15803D", iconBg: "#EAF7ED", iconBorder: "#C8E5CF", border: "#C8E5CF", gradientEnd: "#F6FFF8", shadow: "rgba(21, 128, 61, 0.05)" },
  amber:  { icon: "#B45309", iconBg: "#FFF4D6", iconBorder: "#F0DCA6", border: "#EEDDB5", gradientEnd: "#FFFCF4", shadow: "rgba(180, 83, 9, 0.05)" },
  violet: { icon: "#7C3AED", iconBg: "#F3EDFF", iconBorder: "#E0D3FA", border: "#E0D3FA", gradientEnd: "#FBF8FF", shadow: "rgba(124, 58, 237, 0.05)" },
  gold:   { icon: "#9A6700", iconBg: "#FFF6D9", iconBorder: "#E9DDB2", border: "#E9DDB2", gradientEnd: "#FFFEF6", shadow: "rgba(154, 103, 0, 0.05)" },
};

// Actions ------------------------------------------------------------
export const actions = [
  { id: "create-loan", path: "/create-loan",   label: "New loan",       desc: "Register a new gold loan",          icon: icons.newLoan, theme: themes.red },
  { id: "search-loan", path: "/search-loan",   label: "Search loan",    desc: "Find by name, phone or loan no.",   icon: icons.search,  theme: themes.indigo },
  { id: "payment",     path: "/search-loan",   label: "Payment",        desc: "Record an interest or EMI payment", icon: icons.payment, theme: themes.green },
  { id: "renewal",     path: "/search-loan",   label: "Renewal",        desc: "Renew a loan term",                 icon: icons.renewal, theme: themes.amber },
  { id: "topup",       path: "/search-loan",   label: "Top-up",         desc: "Add extra loan amount",             icon: icons.topUp,   theme: themes.violet },
  { id: "summary",     path: "/staff-summary", label: "Branch Summary", desc: "View daily collection report",      icon: icons.summary, theme: themes.gold },
];
