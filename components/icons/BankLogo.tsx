import React from 'react';
import { Bank } from '../../types';
import Icon from './Icon';

interface BankLogoProps {
  bank: Bank;
  className?: string;
}

const getLogoSrc = (bank: Bank): string | null => {
  if (bank === Bank.OUTRO) {
    return null;
  }
  // Creates a URL-friendly slug from the bank name
  const slug = bank
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, '-'); // replace spaces with hyphens
  
  // Assuming PNG files as per user's instructions on file naming.
  return `/images/banco_${slug}.png`;
};

const BankLogo: React.FC<BankLogoProps> = ({ bank, className = 'h-8' }) => {
  const src = getLogoSrc(bank);

  if (!src) {
    return <Icon name="building-columns" className={className} />;
  }

  return <img src={src} alt={`${bank} Logo`} className={`${className} object-contain`} />;
};

export default BankLogo;