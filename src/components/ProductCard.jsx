import { ArrowRight, Plus } from "lucide-react";

export default function ProductCard({
  product,
  money,
  onQuickView,
  onAddToCart,
}) {
  return (
    <article className="product-card">
      <button
        className="product-image"
        onClick={() => onQuickView(product)}
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        {product.featured && (
          <span className="product-badge">CUSTOMER FAVOURITE</span>
        )}
        {product.stock === false && (
          <span className="sold-badge">Out of stock</span>
        )}
        <span className="quick-view">
          Quick view <ArrowRight size={15} />
        </span>
      </button>
      <div className="product-info">
        <div>
          <span className="product-category">{product.category}</span>
          <h3>{product.name}</h3>
          <span className="product-material">
            {product.material || "Thoughtfully designed"}
          </span>
        </div>
        <div className="price-wrap">
          <strong>{money(product.price)}</strong>
          {product.oldPrice > product.price && (
            <del>{money(product.oldPrice)}</del>
          )}
        </div>
      </div>
      <button
        className="add-btn"
        disabled={product.stock === false}
        onClick={() => onAddToCart(product)}
      >
        <Plus size={16} />
        {product.stock === false ? "Currently unavailable" : "Add to bag"}
      </button>
    </article>
  );
}
