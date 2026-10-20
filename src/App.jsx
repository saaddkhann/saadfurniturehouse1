import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import {
  ArrowRight,
  Check,
  CircleUserRound,
  CreditCard,
  Menu,
  Package,
  PhoneCall,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sofa,
  Truck,
  X
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import ProductGrid from "./components/ProductGrid";
import { auth, db, firebaseConfigured } from "./firebase";

const seedProducts = [
  {
    id: "demo-bed",
    name: "Aarav Solid Wood Bed",
    category: "Beds",
    price: "free",
    oldPrice: 28999,
    material: "Solid wood",
    size: "King size",
    description:
      "A timeless wooden bed with a warm natural finish and sturdy construction.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85",
    featured: true,
    stock: true,
  },
  {
    id: "demo-sofa",
    name: "Linen Comfort Sofa",
    category: "Sofas",
    price: 32999,
    oldPrice: 36999,
    material: "Linen fabric",
    size: "3 seater",
    description: "A relaxed, comfortable sofa designed for everyday living.",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85",
    featured: true,
    stock: true,
  },
  {
    id: "demo-table",
    name: "Oak Dining Table",
    category: "Dining",
    price: 18999,
    oldPrice: 21999,
    material: "Engineered wood",
    size: "4 seater",
    description:
      "A clean, modern dining table for family meals and gatherings.",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=85",
    featured: true,
    stock: true,
  },
  {
    id: "demo-chair",
    name: "Minimal Accent Chair",
    category: "Chairs",
    price: 7499,
    oldPrice: 8999,
    material: "Wood and fabric",
    size: "Single seat",
    description: "A versatile accent chair that adds a quiet, refined touch.",
    image:
      "https://images.unsplash.com/photo-1598300053653-1b6f4b7c6f5b?auto=format&fit=crop&w=1000&q=85",
    featured: false,
    stock: true,
  },
  {
    id: "demo-wardrobe",
    name: "Classic 3-Door Wardrobe",
    category: "Wardrobes",
    price: 27999,
    oldPrice: 31999,
    material: "Engineered wood",
    size: "3 door",
    description: "Practical storage with a minimal, easy-to-style design.",
    image:
      "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1000&q=85",
    featured: false,
    stock: true,
  },
  {
    id: "demo-coffee",
    name: "Round Coffee Table",
    category: "Tables",
    price: 5999,
    oldPrice: 6999,
    material: "Wood",
    size: "Compact",
    description: "A simple statement piece for your living room.",
    image:
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1000&q=85",
    featured: false,
    stock: true,
  },
];
const money = (n) => {
  if (n === null || n === undefined || n === "") return "Price unavailable";
  const value = Number(String(n ?? "").replace(/,/g, "").trim());

  if (!Number.isFinite(value)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};
const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const upiId = import.meta.env.VITE_UPI_ID || "";
const upiName = import.meta.env.VITE_UPI_NAME || "Saad Furniture House";

function App() {
  const [products, setProducts] = useState(seedProducts);
  const [customCategories, setCustomCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [adminTab, setAdminTab] = useState("products");
  const [busy, setBusy] = useState(false);
  const [upiQr, setUpiQr] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    delivery: "delivery",
    payment: "cod",
  });
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Beds",
    price: "",
    oldPrice: "",
    material: "",
    size: "",
    description: "",
    image: "",
    stock: true,
    featured: false,
  });
  const [editingId, setEditingId] = useState(null);
  const [adminLogin, setAdminLogin] = useState({ email: "", password: "" });
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onSnapshot(
      collection(db, "categories"),
      (snap) =>
        setCustomCategories(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((c) => c.name)
            .map((c) => c.name),
        ),
      (err) => console.error("Category read error:", err),
    );
  }, []);
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onSnapshot(
      collection(db, "products"),
      (snap) => {
        if (!snap.empty)
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Product read error:", err),
    );
  }, []);
  useEffect(() => {
    if (!user || !firebaseConfigured) {
      setOrders([]);
      return;
    }
    return onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err),
    );
  }, [user]);
  useEffect(() => {
    if (upiId && checkoutOpen)
      QRCode.toDataURL(
        `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&cu=INR`,
        { width: 220, margin: 1 },
      )
        .then(setUpiQr)
        .catch(() => {});
  }, [checkoutOpen]);
  const baseCategories = [
    "Beds",
    "Sofas",
    "Dining",
    "Chairs",
    "Wardrobes",
    "Tables",
    "Other",
  ];
  const categories = [
    "All",
    ...new Set([
      ...baseCategories,
      ...customCategories,
      ...products.map((p) => p.category).filter(Boolean),
    ]),
  ];
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          `${p.name} ${p.category} ${p.material || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [products, category, search],
  );
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const addToCart = (p) => {
    setCart((old) => {
      const found = old.find((i) => i.id === p.id);
      return found
        ? old.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [...old, { ...p, qty: 1 }];
    });
    setNotice(`${p.name} added to your bag`);
    setTimeout(() => setNotice(""), 2600);
  };
  const updateQty = (id, delta) =>
    setCart((old) =>
      old
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  const submitOrder = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    setBusy(true);
    const order = {
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address:
          form.delivery === "delivery" ? form.address.trim() : "Shop pickup",
      },
      items: cart.map(({ id, name, price, qty, image }) => ({
        productId: id,
        name,
        price: (price),
        qty,
        image,
      })),
      total,
      paymentMethod: form.payment,
      deliveryMethod: form.delivery,
      status: "Pending",
      paymentStatus:
        form.payment === "cod" ? "Pay on delivery" : "Awaiting payment",
      createdAt: serverTimestamp(),
    };
    try {
      if (firebaseConfigured) {
        const ref = await addDoc(collection(db, "orders"), order);
        setNotice(
          `Order placed successfully! Order ID: ${ref.id.slice(0, 8).toUpperCase()}`,
        );
        if (form.payment === "upi" && upiId)
          window.open(
            `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tn=${encodeURIComponent("Order " + ref.id.slice(0, 8))}`,
            "_blank",
          );
      } else {
        const localId = "DEMO-" + Date.now().toString().slice(-6);
        setNotice(
          `Demo order ${localId} created locally. Add Firebase settings to save real orders.`,
        );
      }
      if (waNumber && !waNumber.includes("X")) {
        const msg = `Hello ${upiName}, I'd like to confirm my order.\nOrder total: ${money(total)}\nItems: ${cart.map((i) => `${i.name} x ${i.qty}`).join(", ")}\nName: ${form.name}\nPhone: ${form.phone}\nDelivery: ${form.delivery}\nPayment: ${form.payment.toUpperCase()}`;
        window.open(
          `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`,
          "_blank",
        );
      }
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (err) {
      console.error(err);
      setNotice(
        "Could not save order. Check Firebase configuration and rules.",
      );
    } finally {
      setBusy(false);
      setTimeout(() => setNotice(""), 6500);
    }
  };
  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        adminLogin.email,
        adminLogin.password,
      );
      setNotice("Admin signed in");
    } catch (err) {
      setNotice("Login failed: " + err.message);
    } finally {
      setBusy(false);
    }
  };
  const saveCategory = async (e) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setNotice("That category already exists");
      return;
    }
    if (!firebaseConfigured) {
      setNotice("Add your Firebase settings in .env to save categories.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "categories"), {
        name,
        createdAt: serverTimestamp(),
      });
      setNewCategory("");
      setNotice(`Category “${name}” added`);
    } catch (err) {
      setNotice("Could not save category: " + err.message);
    } finally {
      setBusy(false);
      setTimeout(() => setNotice(""), 4000);
    }
  };
  const saveProduct = async (e) => {
    e.preventDefault();
    if (!firebaseConfigured) {
      setNotice("Add your Firebase settings in .env first.");
      return;
    }
    setBusy(true);
    const data = {
      ...productForm,
      name: productForm.name.trim(),
      price: String(productForm.price ?? "").trim(),
      oldPrice: String(productForm.oldPrice ?? "").trim() || 0,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingId) await updateDoc(doc(db, "products", editingId), data);
      else
        await addDoc(collection(db, "products"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      setProductForm({
        name: "",
        category: "Beds",
        price: "",
        oldPrice: "",
        material: "",
        size: "",
        description: "",
        image: "",
        stock: true,
        featured: false,
      });
      setEditingId(null);
      setNotice("Product saved successfully");
    } catch (err) {
      setNotice("Could not save product: " + err.message);
    } finally {
      setBusy(false);
      setTimeout(() => setNotice(""), 4000);
    }
  };
  const editProduct = (p) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name || "",
      category: p.category || "Beds",
      price: p.price || "",
      oldPrice: p.oldPrice || "",
      material: p.material || "",
      size: p.size || "",
      description: p.description || "",
      image: p.image || "",
      stock: p.stock !== false,
      featured: !!p.featured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const removeProduct = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
      setNotice("Product deleted");
    } catch (e) {
      setNotice("Delete failed: " + e.message);
    }
  };
  const updateOrder = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status,
        updatedAt: serverTimestamp(),
      });
      setNotice("Order status updated");
    } catch (e) {
      setNotice("Could not update order: " + e.message);
    }
  };
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
      preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) {
      setNotice(
        "Configure Cloudinary in .env to upload images. You can paste an image URL for now.",
      );
      return;
    }
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", preset);
    setBusy(true);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        { method: "POST", body: data },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      setProductForm((p) => ({ ...p, image: json.secure_url }));
      setNotice("Image uploaded");
    } catch (err) {
      setNotice("Image upload failed: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="announcement">
        Thoughtfully chosen furniture for the way you live <span>•</span> Local
        delivery & shop pickup
      </div>
      <header className="header">
        <button
          className="mobile-menu icon-btn"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Menu"
        >
          <Menu size={21} />
        </button>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-mark">
            <Sofa size={23} />
          </span>
          <span>
            <strong>SAAD</strong>
            <small>FURNITURE HOUSE</small>
          </span>
        </a>
        <nav className={mobileMenu ? "nav nav-open" : "nav"}>
          <a href="#shop" onClick={() => setMobileMenu(false)}>
            Shop
          </a>
          <a href="#collections" onClick={() => setMobileMenu(false)}>
            Collections
          </a>
          <a href="#about" onClick={() => setMobileMenu(false)}>
            Our story
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="icon-btn"
            title="Admin login"
            onClick={() => setAdminOpen(true)}
          >
            <CircleUserRound size={21} />
            <span className="admin-label">Admin</span>
          </button>
          <button className="bag-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} />
            <span>Bag</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line"></span> MADE FOR YOUR HOME
            </span>
            <h1>
              Make room for
              <br />
              <em>better living.</em>
            </h1>
            <p>
              Furniture with considered details, warm materials and everyday
              comfort. Find pieces you'll love coming home to.
            </p>
            <div className="hero-actions">
              <a className="btn btn-dark" href="#shop">
                Explore collection <ArrowRight size={17} />
              </a>
              <a className="text-link" href="#about">
                Discover our story
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={15} /> Thoughtful designs
              </span>
              <span>
                <Check size={15} /> Made for everyday
              </span>
            </div>
          </div>
          <div className="hero-image-wrap">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=90"
              alt="Warm, minimal living room furniture"
            />
            <div className="hero-tag">
              <span>THE EVERYDAY EDIT</span>
              <strong>Comfort, naturally.</strong>
            </div>
            <div className="hero-index">
              01 <span>/</span> 03
            </div>
          </div>
        </section>
        <section className="benefits">
          <div>
            <Truck />
            <span>
              <strong>Local delivery</strong>
              <small>Delivery in your area</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Easy ordering</strong>
              <small>Online or via WhatsApp</small>
            </span>
          </div>
          <div>
            <CreditCard />
            <span>
              <strong>Flexible payments</strong>
              <small>UPI or cash on delivery</small>
            </span>
          </div>
          <div>
            <Package />
            <span>
              <strong>Shop pickup</strong>
              <small>Collect at your convenience</small>
            </span>
          </div>
        </section>
        <section id="collections" className="collections section-wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIND YOUR STYLE</span>
              <h2>Shop by collection</h2>
            </div>
            <a href="#shop" className="text-link">
              View all furniture <ArrowRight size={16} />
            </a>
          </div>
          <div className="category-grid">
            {[
              {
                name: "Beds",
                sub: "Rest easy",
                img: "photo-1505693416388-ac5ce068fe85",
              },
              {
                name: "Sofas",
                sub: "Gather together",
                img: "photo-1555041469-a586c61ea9bc",
              },
              {
                name: "Dining",
                sub: "Come to the table",
                img: "photo-1617806118233-18e1de247200",
              },
              {
                name: "Wardrobes",
                sub: "A place for everything",
                img: "photo-1631679706909-1844bbd07221",
              },
            ].map((c) => (
              <button
                className="category-tile"
                key={c.name}
                onClick={() => {
                  setCategory(c.name);
                  document
                    .getElementById("shop")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <img
                  src={`https://images.unsplash.com/${c.img}?auto=format&fit=crop&w=700&q=80`}
                  alt={c.name}
                />
                <span className="tile-shade"></span>
                <span className="tile-copy">
                  <strong>{c.name}</strong>
                  <small>{c.sub}</small>
                </span>
                <span className="tile-arrow">
                  <ArrowRight size={17} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section id="shop" className="shop-section section-wrap">
          <div className="section-heading shop-heading">
            <div>
              <span className="eyebrow">THE SAAD SELECTION</span>
              <h2>Furniture to feel at home with</h2>
              <p className="section-sub">
                Good design. Useful details. A little more comfort every day.
              </p>
            </div>
            <div className="search-box">
              <Search size={17} />
              <input
                placeholder="Search furniture..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-row">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={category === c ? "filter active" : "filter"}
              >
                {c}
              </button>
            ))}
            <span className="result-count">{filtered.length} pieces</span>
          </div>
          <ProductGrid
            products={filtered.map((p, i) => ({
              ...p,
              image: p.image || seedProducts[i % seedProducts.length].image,
            }))}
            money={money}
            onQuickView={setSelected}
            onAddToCart={addToCart}
            onClearFilters={() => {
              setSearch("");
              setCategory("All");
            }}
          />
        </section>
       <section className="story-banner" id="about">
  <div className="story-photo">
    <img
      src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85"
      alt="Beautiful home interior"
    />
  </div>

  <div className="story-copy">
    <span className="eyebrow">MEET THE OWNER</span>

    <h2>
      A personal touch.
      <br />
      <em>A home you'll love.</em>
    </h2>

    <p>
      Welcome to Saad Furniture House, founded by Shahid Khan.
      Our goal is to help every customer find furniture that
      brings comfort, functionality, and timeless style into
      their home.
    </p>

    <p>
      We believe choosing furniture should be a simple and
      enjoyable experience. We're committed to helping you
      discover pieces that suit your space, style, and budget.
    </p>

    <div className="owner-signature">
      <strong>MOHAZZAM KHAN</strong>
      <span>Owner, Saad Furniture House
       
      </span>
    </div>

    <a className="btn btn-dark" href="#shop">
      Explore our collection
      <ArrowRight size={17} />
    </a>
  </div>
</section>
        <section className="newsletter">
          <span className="eyebrow">A LITTLE HOME INSPIRATION</span>
          <h2>Let's make your space feel like you.</h2>
          <p>
            Browse the collection or talk to us about what you're looking for.

          </p>
          
          <a
            className="btn btn-light"
            href={
              waNumber && !waNumber.includes("X")
                ? `https://wa.me/${waNumber}`
                : "#shop"
            }
            target={waNumber && !waNumber.includes("X") ? "_blank" : undefined}
            rel="noreferrer"
          >
            Talk to our team <ArrowRight size={16} />
          </a>
        </section>
      </main>
      <footer className="footer">
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">
            <Sofa size={22} />
          </span>
          <span>
            <strong>SAAD</strong>
            <small>FURNITURE HOUSE</small>
          </span>
        </a>
        <p>Furniture for living, resting and gathering.</p>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Saad Furniture House</span>
          <span>Designed for everyday living.</span>
          <button onClick={() => setAdminOpen(true)}>Admin access</button>
        </div>
      </footer>

      {notice && (
        <div className="toast">
          <Check size={17} />
          {notice}
          <button onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div
            className="modal product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setSelected(null)}>
              <X />
            </button>
            <img
              className="modal-product-img"
              src={selected.image}
              alt={selected.name}
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
            <div className="modal-product-copy">
              <span className="eyebrow">{selected.category}</span>
              <h2>{selected.name}</h2>
              <div className="modal-price">
                {money(selected.price)}{" "}
                {selected.oldPrice > selected.price && (
                  <del>{money(selected.oldPrice)}</del>
                )}
              </div>
              <p>{selected.description}</p>
              <div className="spec-list">
                <span>
                  Material <b>{selected.material || "—"}</b>
                </span>
                <span>
                  Size <b>{selected.size || "—"}</b>
                </span>
                <span>
                  Availability{" "}
                  <b>
                    {selected.stock === false ? "Out of stock" : "In stock"}
                  </b>
                </span>
              </div>
              <button
                className="btn btn-dark full-btn"
                disabled={selected.stock === false}
                onClick={() => {
                  addToCart(selected);
                  setSelected(null);
                  setCartOpen(true);
                }}
              >
                Add to bag <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
      {cartOpen && (
        <div
          className="overlay drawer-overlay"
          onClick={() => setCartOpen(false)}
        >
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span className="eyebrow">YOUR SELECTION</span>
                <h2>Your bag ({cartCount})</h2>
              </div>
              <button className="close-btn" onClick={() => setCartOpen(false)}>
                <X />
              </button>
            </div>
            {!cart.length ? (
              <div className="empty-state">
                <ShoppingBag size={35} />
                <h3>Your bag is taking a break</h3>
                <p>Add something lovely to get started.</p>
                <button
                  className="btn btn-dark"
                  onClick={() => setCartOpen(false)}
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((i) => (
                    <div className="cart-item" key={i.id}>
                      <img src={i.image} alt={i.name} />
                      <div className="cart-item-info">
                        <h3>{i.name}</h3>
                        <strong>{money(i.price)}</strong>
                        <div className="qty-control">
                          <button onClick={() => updateQty(i.id, -1)}>−</button>
                          <span>{i.qty}</span>
                          <button onClick={() => updateQty(i.id, 1)}>+</button>
                        </div>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() =>
                          setCart((old) => old.filter((x) => x.id !== i.id))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <small>
                    Delivery charges, if any, will be confirmed by the shop.
                  </small>
                  <button
                    className="btn btn-dark full-btn"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                  >
                    Continue to checkout <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
      {checkoutOpen && (
        <div className="overlay" onClick={() => setCheckoutOpen(false)}>
          <div
            className="modal checkout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setCheckoutOpen(false)}
            >
              <X />
            </button>
            <span className="eyebrow">ALMOST YOURS</span>
            <h2>Checkout</h2>
            <p className="muted">Tell us where to send your furniture.</p>
            <form onSubmit={submitOrder} className="checkout-form">
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
              <label>
                Mobile number
                <input
                  required
                  inputMode="tel"
                  pattern="[0-9+ ()-]{10,16}"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </label>
              <label>
                Delivery option
                <select
                  value={form.delivery}
                  onChange={(e) =>
                    setForm({ ...form, delivery: e.target.value })
                  }
                >
                  <option value="delivery">Local delivery</option>
                  <option value="pickup">Shop pickup</option>
                </select>
              </label>
              {form.delivery === "delivery" && (
                <label>
                  Full delivery address
                  <textarea
                    required
                    rows="3"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="House, street, area, city, PIN code"
                  />
                </label>
              )}
              <label>
                Payment method
                <select
                  value={form.payment}
                  onChange={(e) =>
                    setForm({ ...form, payment: e.target.value })
                  }
                >
                  <option value="cod">Cash on delivery / pay at pickup</option>
                  <option value="upi">UPI payment</option>
                </select>
              </label>
              {form.payment === "upi" && (
                <div className="upi-box">
                  {upiQr ? (
                    <img src={upiQr} alt="UPI QR code" />
                  ) : (
                    <div className="qr-placeholder">
                      <CreditCard size={26} />
                      <small>Configure your UPI ID in .env</small>
                    </div>
                  )}
                  <div>
                    <strong>Pay using any UPI app</strong>
                    <p>{upiId || "Your shop UPI ID is not configured yet."}</p>
                    <small>
                      UPI app will open after order submission where supported.
                      Payment is not automatically verified in this starter.
                    </small>
                  </div>
                </div>
              )}
              <div className="checkout-total">
                <span>Order total</span>
                <strong>{money(total)}</strong>
              </div>
              <button className="btn btn-dark full-btn" disabled={busy}>
                {busy ? "Placing order…" : `Place order · ${money(total)}`}
              </button>
              <small className="form-note">
                Your order will be sent to the shop for confirmation. Online UPI
                payment requires your real UPI ID; automatic payment
                verification requires a payment gateway integration.
              </small>
            </form>
          </div>
        </div>
      )}
      {adminOpen && (
        <div className="overlay" onClick={() => setAdminOpen(false)}>
          <div
            className="modal admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setAdminOpen(false)}>
              <X />
            </button>
            {!user ? (
              <>
                <span className="eyebrow">STORE MANAGEMENT</span>
                <h2>Admin sign in</h2>
                <p className="muted">
                  Use the admin account created in Firebase Authentication.
                </p>
                <form className="checkout-form" onSubmit={login}>
                  <label>
                    Email
                    <input
                      required
                      type="email"
                      value={adminLogin.email}
                      onChange={(e) =>
                        setAdminLogin({ ...adminLogin, email: e.target.value })
                      }
                      placeholder="admin@example.com"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      required
                      type="password"
                      value={adminLogin.password}
                      onChange={(e) =>
                        setAdminLogin({
                          ...adminLogin,
                          password: e.target.value,
                        })
                      }
                      placeholder="Your password"
                    />
                  </label>
                  <button className="btn btn-dark full-btn" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in securely"}
                  </button>
                </form>
                <p className="admin-hint">
                  Admin access is secured by Firebase Authentication and
                  Firestore rules. Don't create a public admin sign-up form.
                </p>
              </>
            ) : (
              <>
                <div className="admin-top">
                  <div>
                    <span className="eyebrow">SAAD FURNITURE HOUSE</span>
                    <h2>Store dashboard</h2>
                    <small>{user.email}</small>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => signOut(auth)}
                  >
                    Sign out
                  </button>
                </div>
                <div className="admin-stats">
                  <div>
                    <small>Products</small>
                    <strong>{products.length}</strong>
                  </div>
                  <div>
                    <small>Total orders</small>
                    <strong>{orders.length}</strong>
                  </div>
                  <div>
                    <small>Pending</small>
                    <strong>
                      {orders.filter((o) => o.status === "Pending").length}
                    </strong>
                  </div>
                </div>
                <div className="admin-tabs">
                  <button
                    className={adminTab === "products" ? "active" : ""}
                    onClick={() => setAdminTab("products")}
                  >
                    Products
                  </button>
                  <button
                    className={adminTab === "categories" ? "active" : ""}
                    onClick={() => setAdminTab("categories")}
                  >
                    Categories
                  </button>
                  <button
                    className={adminTab === "orders" ? "active" : ""}
                    onClick={() => setAdminTab("orders")}
                  >
                    Orders
                  </button>
                </div>
                {adminTab === "categories" ? (
                  <div className="admin-content">
                    <h3>Furniture categories</h3>
                    <p className="muted">
                      Add categories such as Beds, Sofas, Dining, or any new
                      furniture type.
                    </p>
                    <form
                      className="category-admin-form"
                      onSubmit={saveCategory}
                    >
                      <label>
                        New category
                        <input
                          required
                          maxLength={40}
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="e.g. TV Units"
                        />
                      </label>
                      <button className="btn btn-dark" disabled={busy}>
                        {busy ? "Saving…" : "Add category"}
                      </button>
                    </form>
                    <div className="category-admin-list">
                      {categories
                        .filter((c) => c !== "All")
                        .map((c) => (
                          <span key={c}>
                            {c}
                            {customCategories.includes(c) ? (
                              <small>Custom</small>
                            ) : (
                              <small>Default</small>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                ) : adminTab === "products" ? (
                  <div className="admin-content">
                    <h3>{editingId ? "Edit furniture" : "Add furniture"}</h3>
                    <form className="admin-product-form" onSubmit={saveProduct}>
                      <label>
                        Furniture name
                        <input
                          
                          value={productForm.name}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Category
                        <select
                          value={productForm.category}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              category: e.target.value,
                            })
                          }
                        >
                          {categories
                            .filter((c) => c !== "All")
                            .map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Price (₹)
                        <input
                          
                          
                          type="text"
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Old price (₹)
                        <input
                          
                          type="text"
                          value={productForm.oldPrice}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              oldPrice: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Material
                        <input
                          value={productForm.material}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              material: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        Size / dimensions
                        <input
                          value={productForm.size}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              size: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="span-two">
                        Image URL
                        <input
                          value={productForm.image}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              image: e.target.value,
                            })
                          }
                          placeholder="Paste image URL or upload below"
                        />
                      </label>
                      <label className="span-two upload-label">
                        Upload product photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={uploadImage}
                        />
                        <small>
                          Configure Cloudinary in .env for direct uploads.
                        </small>
                      </label>
                      <label className="span-two">
                        Description
                        <textarea
                          rows="2"
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={productForm.stock}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              stock: e.target.checked,
                            })
                          }
                        />{" "}
                        In stock
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={productForm.featured}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              featured: e.target.checked,
                            })
                          }
                        />{" "}
                        Featured item
                      </label>
                      <div className="span-two form-buttons">
                        <button className="btn btn-dark" disabled={busy}>
                          {busy
                            ? "Saving…"
                            : editingId
                              ? "Update furniture"
                              : "Publish furniture"}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              setEditingId(null);
                              setProductForm({
                                name: "",
                                category: "Beds",
                                price: "",
                                oldPrice: "",
                                material: "",
                                size: "",
                                description: "",
                                image: "",
                                stock: true,
                                featured: false,
                              });
                            }}
                          >
                            Cancel edit
                          </button>
                        )}
                      </div>
                    </form>
                    <h3 className="manage-heading">Manage products</h3>
                    <div className="admin-list">
                      {products.map((p) => (
                        <div className="admin-list-row" key={p.id}>
                          <img src={p.image} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              {p.category} · {money(p.price)}
                            </small>
                          </div>
                          <button
                            className="btn btn-outline mini-btn"
                            onClick={() => editProduct(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => removeProduct(p)}
                          >
                            <X size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="admin-content">
                    <h3>Customer orders</h3>
                    {!orders.length ? (
                      <p className="muted">
                        No saved orders yet. New orders will appear here.
                      </p>
                    ) : (
                      <div className="orders-list">
                        {orders.map((o) => (
                          <div className="order-card" key={o.id}>
                            <div className="order-card-head">
                              <div>
                                <strong>
                                  Order #{o.id.slice(0, 8).toUpperCase()}
                                </strong>
                                <small>
                                  {o.customer?.name} · {o.customer?.phone}
                                </small>
                              </div>
                              <strong>{money(o.total)}</strong>
                            </div>
                            <p>
                              {(o.items || [])
                                .map((i) => `${i.name} × ${i.qty}`)
                                .join(", ")}
                            </p>
                            <small>
                              {o.customer?.address} · {o.deliveryMethod} ·{" "}
                              {o.paymentMethod?.toUpperCase()} ·{" "}
                              {o.paymentStatus}
                            </small>
                            <div className="order-status-row">
                              <span>Status</span>
                              <select
                                value={o.status || "Pending"}
                                onChange={(e) =>
                                  updateOrder(o.id, e.target.value)
                                }
                              >
                                {[
                                  "Pending",
                                  "Confirmed",
                                  "Processing",
                                  "Delivered",
                                  "Cancelled",
                                ].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                              <a
                                className="text-link"
                                href={`https://wa.me/${String(o.customer?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${o.customer?.name}, regarding your order ${o.id.slice(0, 8).toUpperCase()} from Saad Furniture House.`)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                WhatsApp customer
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <a
  href="tel:+918127839225"
  className="floating-call"
  aria-label="Call Saad Furniture House"
  title="Call us"
>
  <PhoneCall size={28} />
</a>
    </div>
  );
}
export default App;
