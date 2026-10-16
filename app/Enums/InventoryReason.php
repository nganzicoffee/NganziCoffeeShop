<?php

namespace App\Enums;

enum InventoryReason: string
{
    case Sale = 'sale';
    case SaleReversed = 'sale_reversed';
    case StockIn = 'stock_in';
    case Adjustment = 'adjustment';
    case Damaged = 'damaged';
    case Lost = 'lost';
    case InitialStock = 'initial_stock';

    public function label(): string
    {
        return match ($this) {
            self::Sale => 'Sale',
            self::SaleReversed => 'Sale reversed',
            self::StockIn => 'Stock received',
            self::Adjustment => 'Manual adjustment',
            self::Damaged => 'Damaged / written off',
            self::Lost => 'Lost',
            self::InitialStock => 'Initial stock',
        };
    }
}
