"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Category = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

export default function OwnerMenuPage() {
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("restaurant");

    if (!id) {
      setMessage("No restaurant selected.");
      setLoading(false);
      return;
    }

    setRestaurantId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You are not signed in.");
      setLoading(false);
      return;
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,name")
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      setMessage(restaurantError?.message || "Restaurant not found.");
      setLoading(false);
      return;
    }

    setRestaurantName(restaurant.name);

    const { data: categoryData, error: categoryError } = await supabase
      .from("restaurant_menu_categories")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoryError) {
      setMessage(categoryError.message);
      setLoading(false);
      return;
    }

    const { data: itemData, error: itemError } = await supabase
      .from("restaurant_menu_items")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (itemError) {
      setMessage(itemError.message);
      setLoading(false);
      return;
    }

    setCategories(categoryData || []);
    setItems(itemData || []);
    setLoading(false);
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name || !restaurantId) return;

    setMessage("");

    const { error } = await supabase
      .from("restaurant_menu_categories")
      .insert({
        restaurant_id: restaurantId,
        name,
        sort_order: categories.length,
        active: true,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewCategory("");
    await loadMenu();
  }

  async function addItem() {
    const name = newItemName.trim();

    if (!restaurantId || !name) {
      setMessage("Item name is required.");
      return;
    }

    const price =
      newItemPrice.trim() === ""
        ? null
        : Number(newItemPrice.replace(/[^0-9.]/g, ""));

    if (price !== null && Number.isNaN(price)) {
      setMessage("Enter a valid price.");
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("restaurant_menu_items")
      .insert({
        restaurant_id: restaurantId,
        category_id: newItemCategory || null,
        name,
        description: newItemDescription.trim() || null,
        price,
        available: true,
        featured: false,
        sort_order: items.length,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewItemName("");
    setNewItemDescription("");
    setNewItemPrice("");
    setNewItemCategory("");
    await loadMenu();
  }

  async function updateCategory(category: Category) {
    const { error } = await supabase
      .from("restaurant_menu_categories")
      .update({
        name: category.name,
        active: category.active,
        sort_order: category.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", category.id)
      .eq("restaurant_id", restaurantId);

    setMessage(error ? error.message : "Category saved.");
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category? Items will remain uncategorized.")) {
      return;
    }

    const { error } = await supabase
      .from("restaurant_menu_categories")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadMenu();
  }

  async function updateItem(item: MenuItem) {
    const { error } = await supabase
      .from("restaurant_menu_items")
      .update({
        category_id: item.category_id,
        name: item.name,
        description: item.description || null,
        price: item.price,
        available: item.available,
        featured: item.featured,
        sort_order: item.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("restaurant_id", restaurantId);

    setMessage(error ? error.message : "Menu item saved.");
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this menu item?")) return;

    const { error } = await supabase
      .from("restaurant_menu_items")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadMenu();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();

    categories.forEach((category) => map.set(category.id, []));
    map.set("uncategorized", []);

    items.forEach((item) => {
      const key =
        item.category_id && map.has(item.category_id)
          ? item.category_id
          : "uncategorized";

      map.get(key)?.push(item);
    });

    return map;
  }, [categories, items]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading menu manager...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>RESTAURANT OS</div>
            <h1 style={titleStyle}>Menu Manager</h1>
            <p style={subStyle}>
              {restaurantName || "Restaurant"} — build, price and control your live menu.
            </p>
          </div>

          <button
            style={secondaryButtonStyle}
            onClick={() =>
              (window.location.href = `/owner?restaurant=${restaurantId}`)
            }
          >
            BACK TO DASHBOARD
          </button>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={statsGridStyle}>
          <Stat label="MENU ITEMS" value={items.length} />
          <Stat label="CATEGORIES" value={categories.length} />
          <Stat
            label="SOLD OUT"
            value={items.filter((item) => !item.available).length}
          />
          <Stat
            label="FEATURED"
            value={items.filter((item) => item.featured).length}
          />
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>MENU STRUCTURE</div>
              <h2 style={sectionTitleStyle}>Categories</h2>
            </div>
          </div>

          <div style={addRowStyle}>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Breakfast, Appetizers, Pizza, Drinks..."
              style={inputStyle}
            />
            <button onClick={addCategory} style={primaryButtonStyle}>
              + ADD CATEGORY
            </button>
          </div>

          {categories.length === 0 ? (
            <EmptyState text="No categories yet. Add the first one above." />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {categories.map((category) => (
                <div key={category.id} style={categoryRowStyle}>
                  <input
                    value={category.name}
                    onChange={(e) =>
                      setCategories((current) =>
                        current.map((c) =>
                          c.id === category.id
                            ? { ...c, name: e.target.value }
                            : c
                        )
                      )
                    }
                    style={inputStyle}
                  />

                  <input
                    type="number"
                    value={category.sort_order}
                    onChange={(e) =>
                      setCategories((current) =>
                        current.map((c) =>
                          c.id === category.id
                            ? { ...c, sort_order: Number(e.target.value) }
                            : c
                        )
                      )
                    }
                    style={smallInputStyle}
                  />

                  <label style={checkLabelStyle}>
                    <input
                      type="checkbox"
                      checked={category.active}
                      onChange={(e) =>
                        setCategories((current) =>
                          current.map((c) =>
                            c.id === category.id
                              ? { ...c, active: e.target.checked }
                              : c
                          )
                        )
                      }
                    />
                    ACTIVE
                  </label>

                  <button
                    onClick={() => updateCategory(category)}
                    style={primaryButtonStyle}
                  >
                    SAVE
                  </button>

                  <button
                    onClick={() => deleteCategory(category.id)}
                    style={dangerButtonStyle}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>ADD FOOD</div>
              <h2 style={sectionTitleStyle}>New Menu Item</h2>
            </div>
          </div>

          <div style={formGridStyle}>
            <Field
              label="ITEM NAME"
              value={newItemName}
              onChange={setNewItemName}
              placeholder="Pepperoni Pizza"
            />

            <Field
              label="PRICE"
              value={newItemPrice}
              onChange={setNewItemPrice}
              placeholder="14.99"
            />

            <div>
              <label style={labelStyle}>CATEGORY</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                style={inputStyle}
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label="DESCRIPTION"
                value={newItemDescription}
                onChange={setNewItemDescription}
                placeholder="Describe the item..."
              />
            </div>
          </div>

          <button onClick={addItem} style={primaryButtonStyle}>
            + ADD MENU ITEM
          </button>
        </section>

        {[...categories, { id: "uncategorized", name: "Uncategorized" } as Category].map(
          (category) => {
            const categoryItems = grouped.get(category.id) || [];

            if (category.id === "uncategorized" && categoryItems.length === 0) {
              return null;
            }

            return (
              <section key={category.id} style={sectionStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <div style={eyebrowStyle}>MENU CATEGORY</div>
                    <h2 style={sectionTitleStyle}>{category.name}</h2>
                  </div>

                  <div style={countPillStyle}>
                    {categoryItems.length} ITEM
                    {categoryItems.length === 1 ? "" : "S"}
                  </div>
                </div>

                {categoryItems.length === 0 ? (
                  <EmptyState text="No menu items in this category yet." />
                ) : (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {categoryItems.map((item) => (
                      <MenuItemEditor
                        key={item.id}
                        item={item}
                        categories={categories}
                        onChange={(next) =>
                          setItems((current) =>
                            current.map((candidate) =>
                              candidate.id === next.id ? next : candidate
                            )
                          )
                        }
                        onSave={() => updateItem(item)}
                        onDelete={() => deleteItem(item.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          }
        )}
      </div>
    </main>
  );
}

function MenuItemEditor({
  item,
  categories,
  onChange,
  onSave,
  onDelete,
}: {
  item: MenuItem;
  categories: Category[];
  onChange: (item: MenuItem) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={itemCardStyle}>
      <div style={formGridStyle}>
        <Field
          label="ITEM NAME"
          value={item.name}
          onChange={(value) => onChange({ ...item, name: value })}
        />

        <PriceField
          label="PRICE"
          value={item.price}
          onChange={(price) =>
            onChange({
              ...item,
              price,
            })
          }
        />

        <div>
          <label style={labelStyle}>CATEGORY</label>
          <select
            value={item.category_id || ""}
            onChange={(e) =>
              onChange({
                ...item,
                category_id: e.target.value || null,
              })
            }
            style={inputStyle}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="SORT ORDER"
          value={String(item.sort_order)}
          onChange={(value) =>
            onChange({
              ...item,
              sort_order: Number(value || 0),
            })
          }
        />

        <div style={{ gridColumn: "1 / -1" }}>
          <Field
            label="DESCRIPTION"
            value={item.description || ""}
            onChange={(value) =>
              onChange({
                ...item,
                description: value,
              })
            }
          />
        </div>
      </div>

      <div style={itemActionsStyle}>
        <label style={checkLabelStyle}>
          <input
            type="checkbox"
            checked={item.available}
            onChange={(e) =>
              onChange({
                ...item,
                available: e.target.checked,
              })
            }
          />
          AVAILABLE
        </label>

        <label style={checkLabelStyle}>
          <input
            type="checkbox"
            checked={item.featured}
            onChange={(e) =>
              onChange({
                ...item,
                featured: e.target.checked,
              })
            }
          />
          FEATURED
        </label>

        <button onClick={onSave} style={primaryButtonStyle}>
          SAVE CHANGES
        </button>

        <button onClick={onDelete} style={dangerButtonStyle}>
          DELETE
        </button>
      </div>
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState(
    value === null || value === undefined ? "" : String(value)
  );

  useEffect(() => {
    const next =
      value === null || value === undefined ? "" : String(value);

    // Do not clobber a user who is in the middle of typing a decimal
    // such as "11." or "11.0".
    if (!draft.endsWith(".") && !/^\d+\.\d$/.test(draft)) {
      setDraft(next);
    }
  }, [value]);

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        inputMode="decimal"
        value={draft}
        placeholder="14.99"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");

          // Allow only one decimal point and up to two decimal places.
          if (!/^\d*(?:\.\d{0,2})?$/.test(raw)) return;

          setDraft(raw);

          if (raw === "") {
            onChange(null);
            return;
          }

          // Preserve intermediate typing states like "11." and "11.0"
          // in the input while only committing a valid numeric value.
          if (raw.endsWith(".") || /^\d+\.\d$/.test(raw)) {
            return;
          }

          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            onChange(parsed);
          }
        }}
        onBlur={() => {
          if (draft === "") {
            onChange(null);
            return;
          }

          const parsed = Number(draft);
          if (!Number.isFinite(parsed)) return;

          const rounded = Math.round(parsed * 100) / 100;
          setDraft(rounded.toFixed(2));
          onChange(rounded);
        }}
        style={inputStyle}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>;
}

const pageStyle = {
  minHeight: "100vh",
  background: "#08111f",
  color: "#ffffff",
  padding: "28px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const shellStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  gap: "20px",
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#f5b82e",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "2px",
};

const titleStyle = {
  fontSize: "clamp(42px,7vw,72px)",
  lineHeight: ".95",
  margin: "8px 0",
  fontWeight: 900,
  letterSpacing: "-2px",
};

const subStyle = {
  color: "#94a3b8",
  fontSize: "16px",
  lineHeight: 1.5,
};

const sectionStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "20px",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "20px",
};

const sectionTitleStyle = {
  margin: "6px 0 0",
  fontSize: "28px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const statStyle = {
  background: "#0f1d2e",
  border: "1px solid #23364d",
  borderRadius: "16px",
  padding: "20px",
};

const statValueStyle = {
  fontSize: "32px",
  fontWeight: 900,
  color: "#f5b82e",
};

const statLabelStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginTop: "5px",
};

const addRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "12px",
  alignItems: "end",
  marginBottom: "18px",
};

const categoryRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(200px,1fr) 90px auto auto auto",
  gap: "10px",
  alignItems: "center",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "16px",
  marginBottom: "18px",
};

const itemCardStyle = {
  background: "#0a1625",
  border: "1px solid #24384f",
  borderRadius: "14px",
  padding: "18px",
};

const itemActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap" as const,
};

const labelStyle = {
  display: "block",
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "1px",
  marginBottom: "7px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "#08111f",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "13px",
  fontSize: "14px",
};

const smallInputStyle = {
  ...inputStyle,
  width: "90px",
};

const checkLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#cbd5e1",
  fontSize: "12px",
  fontWeight: 900,
};

const primaryButtonStyle = {
  background: "#f5b82e",
  color: "#08111f",
  border: 0,
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "12px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: "#3b1118",
  color: "#fecaca",
  border: "1px solid #7f1d1d",
  borderRadius: "10px",
  padding: "12px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const messageStyle = {
  background: "#13263b",
  border: "1px solid #2d4661",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "18px",
};

const countPillStyle = {
  background: "#08111f",
  border: "1px solid #334155",
  borderRadius: "999px",
  padding: "8px 12px",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 900,
};

const emptyStyle = {
  padding: "22px",
  border: "1px dashed #334155",
  borderRadius: "12px",
  color: "#64748b",
  textAlign: "center" as const,
};
