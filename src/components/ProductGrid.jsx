import React from 'react'
import { Sofa } from 'lucide-react'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, money, onQuickView, onAddToCart, onClearFilters }) {
  if (!products.length) return <div className="empty-state"><Sofa size={34}/><h3>No furniture found</h3><p>Try another search or choose a different collection.</p><button className="btn btn-outline" onClick={onClearFilters}>Clear filters</button></div>
  return <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} money={money} onQuickView={onQuickView} onAddToCart={onAddToCart}/>)}</div>
}
