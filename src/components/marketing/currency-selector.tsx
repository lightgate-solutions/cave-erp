"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to NGN (Nigerian Naira)
}

export const CURRENCIES: Currency[] = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", rate: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 0.00067 }, // 1 USD ≈ 1,500 NGN (2024 average)
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.00062 }, // 1 EUR ≈ 1,614 NGN (2024 average)
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.00053 }, // 1 GBP ≈ 1,900 NGN (2024 average)
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 0.00049 }, // 1 CAD ≈ 2,040 NGN (approximate)
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 0.00045 }, // 1 AUD ≈ 2,222 NGN (approximate)
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 0.0045 }, // 1 JPY ≈ 222 NGN (approximate)
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 0.008 }, // 1 INR ≈ 125 NGN (approximate)
  { code: "ZAR", symbol: "R", name: "South African Rand", rate: 0.037 }, // 1 ZAR ≈ 27 NGN (approximate)
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 0.005 }, // 1 KES ≈ 200 NGN (approximate)
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", rate: 0.05 }, // 1 GHS ≈ 20 NGN (approximate)
];

export function CurrencySelector({
  onCurrencyChange,
}: {
  onCurrencyChange?: (currency: Currency) => void;
}) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CURRENCIES[0],
  );

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem("preferred-currency");
    if (savedCurrency) {
      const currency = CURRENCIES.find((c) => c.code === savedCurrency);
      if (currency) {
        setSelectedCurrency(currency);
        onCurrencyChange?.(currency);
      }
    }
  }, [onCurrencyChange]);

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      localStorage.setItem("preferred-currency", currencyCode);
      onCurrencyChange?.(currency);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedCurrency.code}
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue>
            {selectedCurrency.symbol} {selectedCurrency.code}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
