<?php

namespace App\Policies;

use App\Enums\StaffRole;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isStaff();
    }

    public function view(User $user, Product $product): bool
    {
        return $user->isStaff();
    }

    public function create(User $user): bool
    {
        return $user->role?->canWrite() ?? false;
    }

    public function update(User $user, Product $product): bool
    {
        return $user->role?->canWrite() ?? false;
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasRole(StaffRole::Owner);
    }

    public function manageInventory(User $user): bool
    {
        return in_array($user->role, [StaffRole::Owner, StaffRole::InventoryManager], true);
    }
}
