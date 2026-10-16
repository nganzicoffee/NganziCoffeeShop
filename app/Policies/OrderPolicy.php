<?php

namespace App\Policies;

use App\Enums\StaffRole;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isStaff();
    }

    public function view(User $user, Order $order): bool
    {
        return $user->isStaff();
    }

    public function updateStatus(User $user, Order $order): bool
    {
        return in_array($user->role, [StaffRole::Owner, StaffRole::OrderManager], true);
    }

    public function export(User $user): bool
    {
        return in_array($user->role, [
            StaffRole::Owner,
            StaffRole::OrderManager,
            StaffRole::Reporting,
        ], true);
    }
}
