<?php

namespace App\Enums;

enum StaffRole: string
{
    case Owner = 'owner';
    case OrderManager = 'order_manager';
    case InventoryManager = 'inventory_manager';
    case Reporting = 'reporting';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner / Admin',
            self::OrderManager => 'Order Manager',
            self::InventoryManager => 'Inventory Manager',
            self::Reporting => 'Read-only Reporting',
        };
    }

    /** Returns true if this role can perform any admin write action. */
    public function canWrite(): bool
    {
        return $this !== self::Reporting;
    }
}
