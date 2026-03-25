import { useState } from "react";

const tables = {
  users: {
    color: "#6366f1",
    icon: "👤",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "full_name", type: "VARCHAR" },
      { name: "email", type: "VARCHAR" },
      { name: "password", type: "VARCHAR" },
      { name: "phone", type: "VARCHAR" },
      { name: "avatar", type: "VARCHAR" },
      { name: "role", type: "ENUM(USER,ADMIN)" },
      { name: "is_active", type: "BOOLEAN" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  categories: {
    color: "#f59e0b",
    icon: "📂",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "name", type: "VARCHAR" },
      { name: "slug", type: "VARCHAR" },
      { name: "image", type: "VARCHAR" },
    ],
  },
  brands: {
    color: "#f59e0b",
    icon: "🏷️",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "name", type: "VARCHAR" },
      { name: "logo", type: "VARCHAR" },
    ],
  },
  products: {
    color: "#10b981",
    icon: "📱",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "category_id", type: "FK", fk: true },
      { name: "brand_id", type: "FK", fk: true },
      { name: "name", type: "VARCHAR" },
      { name: "slug", type: "VARCHAR" },
      { name: "description", type: "TEXT" },
      { name: "price", type: "DECIMAL" },
      { name: "sale_price", type: "DECIMAL" },
      { name: "stock", type: "INT" },
      { name: "sold", type: "INT" },
      { name: "avg_rating", type: "FLOAT" },
      { name: "is_active", type: "BOOLEAN" },
    ],
  },
  product_images: {
    color: "#10b981",
    icon: "🖼️",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "product_id", type: "FK", fk: true },
      { name: "image_url", type: "VARCHAR" },
      { name: "is_primary", type: "BOOLEAN" },
    ],
  },
  product_specs: {
    color: "#10b981",
    icon: "📋",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "product_id", type: "FK", fk: true },
      { name: "spec_name", type: "VARCHAR" },
      { name: "spec_value", type: "VARCHAR" },
    ],
  },
  addresses: {
    color: "#6366f1",
    icon: "📍",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "user_id", type: "FK", fk: true },
      { name: "full_name", type: "VARCHAR" },
      { name: "phone", type: "VARCHAR" },
      { name: "province", type: "VARCHAR" },
      { name: "district", type: "VARCHAR" },
      { name: "ward", type: "VARCHAR" },
      { name: "detail", type: "TEXT" },
      { name: "is_default", type: "BOOLEAN" },
    ],
  },
  cart: {
    color: "#ec4899",
    icon: "🛒",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "user_id", type: "FK", fk: true },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  cart_items: {
    color: "#ec4899",
    icon: "🛍️",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "cart_id", type: "FK", fk: true },
      { name: "product_id", type: "FK", fk: true },
      { name: "quantity", type: "INT" },
      { name: "price", type: "DECIMAL" },
    ],
  },
  orders: {
    color: "#ef4444",
    icon: "📦",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "user_id", type: "FK", fk: true },
      { name: "address_id", type: "FK", fk: true },
      { name: "coupon_id", type: "FK", fk: true },
      { name: "total_price", type: "DECIMAL" },
      { name: "discount_amount", type: "DECIMAL" },
      { name: "final_price", type: "DECIMAL" },
      { name: "status", type: "ENUM" },
      { name: "payment_method", type: "ENUM" },
      { name: "note", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  order_items: {
    color: "#ef4444",
    icon: "📋",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "order_id", type: "FK", fk: true },
      { name: "product_id", type: "FK", fk: true },
      { name: "quantity", type: "INT" },
      { name: "price", type: "DECIMAL" },
    ],
  },
  payments: {
    color: "#8b5cf6",
    icon: "💳",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "order_id", type: "FK", fk: true },
      { name: "method", type: "ENUM" },
      { name: "status", type: "ENUM" },
      { name: "transaction_id", type: "VARCHAR" },
      { name: "amount", type: "DECIMAL" },
      { name: "paid_at", type: "TIMESTAMP" },
    ],
  },
  coupons: {
    color: "#0ea5e9",
    icon: "🎟️",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "code", type: "VARCHAR" },
      { name: "type", type: "ENUM(PERCENT,FIXED)" },
      { name: "value", type: "DECIMAL" },
      { name: "min_order", type: "DECIMAL" },
      { name: "max_uses", type: "INT" },
      { name: "used_count", type: "INT" },
      { name: "start_date", type: "DATE" },
      { name: "end_date", type: "DATE" },
      { name: "is_active", type: "BOOLEAN" },
    ],
  },
  reviews: {
    color: "#f97316",
    icon: "⭐",
    fields: [
      { name: "id", type: "PK", pk: true },
      { name: "user_id", type: "FK", fk: true },
      { name: "product_id", type: "FK", fk: true },
      { name: "order_id", type: "FK", fk: true },
      { name: "rating", type: "INT(1-5)" },
      { name: "comment", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
};

const relationships = [
  { from: "users", to: "addresses", label: "1 - N" },
  { from: "users", to: "cart", label: "1 - 1" },
  { from: "users", to: "orders", label: "1 - N" },
  { from: "users", to: "reviews", label: "1 - N" },
  { from: "categories", to: "products", label: "1 - N" },
  { from: "brands", to: "products", label: "1 - N" },
  { from: "products", to: "product_images", label: "1 - N" },
  { from: "products", to: "product_specs", label: "1 - N" },
  { from: "products", to: "reviews", label: "1 - N" },
  { from: "cart", to: "cart_items", label: "1 - N" },
  { from: "products", to: "cart_items", label: "1 - N" },
  { from: "orders", to: "order_items", label: "1 - N" },
  { from: "products", to: "order_items", label: "1 - N" },
  { from: "orders", to: "payments", label: "1 - 1" },
  { from: "coupons", to: "orders", label: "1 - N" },
  { from: "addresses", to: "orders", label: "1 - N" },
  { from: "orders", to: "reviews", label: "1 - N" },
];

const groups = [
  { label: "👤 Người dùng", color: "#6366f1", tables: ["users", "addresses"] },
  { label: "📱 Sản phẩm", color: "#10b981", tables: ["categories", "brands", "products", "product_images", "product_specs"] },
  { label: "🛒 Mua sắm", color: "#ec4899", tables: ["cart", "cart_items"] },
  { label: "📦 Đơn hàng", color: "#ef4444", tables: ["orders", "order_items", "payments"] },
  { label: "⭐ Tiện ích", color: "#f97316", tables: ["reviews", "coupons"] },
];

function TableCard({ name, table, isSelected, onClick }) {
  return (
    <div
      onClick={() => onClick(name)}
      style={{
        border: `2px solid ${isSelected ? table.color : "#2a2a3e"}`,
        borderRadius: 12,
        background: isSelected ? `${table.color}15` : "#1a1a2e",
        padding: "12px 0",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: isSelected ? `0 0 20px ${table.color}40` : "none",
        minWidth: 200,
      }}
    >
      {/* Header */}
      <div style={{
        background: table.color,
        margin: "0 0 8px 0",
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{table.icon}</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>
          {name.toUpperCase()}
        </span>
      </div>
      {/* Fields */}
      <div style={{ padding: "0 14px" }}>
        {table.fields.map((f) => (
          <div key={f.name} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "3px 0",
            borderBottom: "1px solid #2a2a3e",
            gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {f.pk && <span style={{ color: "#fbbf24", fontSize: 10 }}>🔑</span>}
              {f.fk && <span style={{ color: "#60a5fa", fontSize: 10 }}>🔗</span>}
              <span style={{
                color: f.pk ? "#fbbf24" : f.fk ? "#60a5fa" : "#e2e8f0",
                fontSize: 12,
                fontFamily: "monospace",
              }}>{f.name}</span>
            </div>
            <span style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>
              {f.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ERDDiagram() {
  const [selected, setSelected] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const handleSelect = (name) => {
    setSelected(selected === name ? null : name);
  };

  const getRelated = (name) => {
    if (!name) return [];
    return relationships
      .filter(r => r.from === name || r.to === name)
      .map(r => ({ table: r.from === name ? r.to : r.from, label: r.label, direction: r.from === name ? "→" : "←" }));
  };

  const related = getRelated(selected);
  const relatedNames = related.map(r => r.table);

  const visibleTables = activeGroup
    ? Object.fromEntries(Object.entries(tables).filter(([k]) => groups.find(g => g.label === activeGroup)?.tables.includes(k)))
    : tables;

  return (
    <div style={{
      background: "#0f0f1a",
      minHeight: "100vh",
      fontFamily: "'Courier New', monospace",
      color: "#e2e8f0",
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          background: "linear-gradient(90deg, #6366f1, #ec4899, #10b981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>
          📱 PhoneShop – Database ERD
        </h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {Object.keys(tables).length} bảng · {relationships.length} quan hệ · Click vào bảng để xem liên kết
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {[{ icon: "🔑", label: "Primary Key", color: "#fbbf24" }, { icon: "🔗", label: "Foreign Key", color: "#60a5fa" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1a1a2e", padding: "4px 12px", borderRadius: 20, border: "1px solid #2a2a3e" }}>
            <span>{l.icon}</span>
            <span style={{ color: l.color, fontSize: 12 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Group Filter */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={() => setActiveGroup(null)} style={{
          padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
          background: !activeGroup ? "#6366f1" : "#1a1a2e", color: !activeGroup ? "#fff" : "#94a3b8",
        }}>Tất cả</button>
        {groups.map(g => (
          <button key={g.label} onClick={() => setActiveGroup(activeGroup === g.label ? null : g.label)} style={{
            padding: "6px 16px", borderRadius: 20, border: `1px solid ${g.color}`, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: activeGroup === g.label ? g.color : "transparent",
            color: activeGroup === g.label ? "#fff" : g.color,
          }}>{g.label}</button>
        ))}
      </div>

      {/* Selected Info */}
      {selected && (
        <div style={{
          background: "#1a1a2e",
          border: `1px solid ${tables[selected]?.color}`,
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}>
          <span style={{ color: tables[selected]?.color, fontWeight: 700, fontSize: 14 }}>
            {tables[selected]?.icon} {selected.toUpperCase()} có quan hệ với:
          </span>
          {related.map(r => (
            <span key={r.table} style={{
              background: `${tables[r.table]?.color}22`,
              border: `1px solid ${tables[r.table]?.color}`,
              color: tables[r.table]?.color,
              padding: "3px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {r.direction} {r.table} ({r.label})
            </span>
          ))}
        </div>
      )}

      {/* Tables Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
        gap: 16,
      }}>
        {Object.entries(visibleTables).map(([name, table]) => (
          <div key={name} style={{
            opacity: selected && !relatedNames.includes(name) && selected !== name ? 0.3 : 1,
            transform: selected === name ? "scale(1.02)" : "scale(1)",
            transition: "all 0.2s",
          }}>
            <TableCard
              name={name}
              table={table}
              isSelected={selected === name || relatedNames.includes(name)}
              onClick={handleSelect}
            />
          </div>
        ))}
      </div>

      {/* Relationships Table */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ color: "#94a3b8", fontSize: 16, marginBottom: 16, textAlign: "center" }}>
          🔗 Bảng quan hệ ({relationships.length} mối quan hệ)
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 8,
        }}>
          {relationships.map((r, i) => (
            <div key={i} style={{
              background: "#1a1a2e",
              border: "1px solid #2a2a3e",
              borderRadius: 8,
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
            }}>
              <span style={{ color: tables[r.from]?.color, fontWeight: 700 }}>{tables[r.from]?.icon} {r.from}</span>
              <span style={{ color: "#475569" }}>──{r.label}──▶</span>
              <span style={{ color: tables[r.to]?.color, fontWeight: 700 }}>{tables[r.to]?.icon} {r.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
