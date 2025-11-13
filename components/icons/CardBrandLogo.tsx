import React from 'react';
import { CardBrand } from '../../types';

interface CardBrandLogoProps {
  brand: CardBrand;
  className?: string;
}

const getLogoSrc = (brand: CardBrand): string | null => {
    if (brand === CardBrand.OUTRA) {
        return null;
    }

    const slug = brand.toLowerCase().replace(/\s+/g, '-');
    
    // Assuming PNG files as per user's instructions on file naming.
    return `/images/bandeira_${slug}.png`;
}

const CardBrandLogo: React.FC<CardBrandLogoProps> = ({ brand, className = 'h-8' }) => {
    const src = getLogoSrc(brand);

    if (!src) {
        return <span className="text-sm font-semibold">{brand}</span>;
    }

    return <img src={src} alt={`${brand} Logo`} className={`${className} object-contain`} />;
};

export default CardBrandLogo;