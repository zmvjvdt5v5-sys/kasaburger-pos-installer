// ProductCard Component
import React from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { formatPrice } from './constants';

export const ProductCard = ({ product, onAdd }) => {
  return (
    <div 
      className="bg-zinc-800 rounded-2xl overflow-hidden group cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
      onClick={() => onAdd(product)}
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img 
          src={product.image || 'https://via.placeholder.com/300x200?text=Ürün'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {product.is_premium && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full">
            👑 PREMIUM
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-zinc-400 text-xs mb-2 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-orange-500 font-black text-xl">{formatPrice(product.price)}</span>
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 rounded-full h-10 w-10 p-0"
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
