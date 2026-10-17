import { Link } from "react-router-dom";

// Styles built from a theme, so each card only needs a color set -----
const cardStyle = (t) => ({
  display: "flex",
  alignItems: "center",
  gap: 18,
  padding: 22,
  minHeight: 120,
  borderRadius: 16,
  border: `1.5px solid ${t.border}`,
  background: `linear-gradient(135deg, #FFFFFF 0%, ${t.gradientEnd} 100%)`,
  boxShadow: `0 3px 10px ${t.shadow}`,
  color: "#241717",
  textDecoration: "none",
  cursor: "pointer",
  transition: "transform 180ms ease, box-shadow 180ms ease",
});

const iconStyle = (t) => ({
  width: 58,
  height: 58,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 15,
  background: t.iconBg,
  border: `1px solid ${t.iconBorder}`,
  color: t.icon,
});

const textWrapStyle = { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 };
const labelStyle = { fontSize: 19, fontWeight: 750, lineHeight: 1.3, color: "#271818" };
const descStyle = { fontSize: 15, lineHeight: 1.5, color: "#795F5F" };

export default function ActionCard({ path, label, desc, icon, theme }) {
  return (
    <Link to={path} style={cardStyle(theme)}>
      <span style={iconStyle(theme)}>{icon}</span>
      <span style={textWrapStyle}>
        <span style={labelStyle}>{label}</span>
        <span style={descStyle}>{desc}</span>
      </span>
    </Link>
  );
}
