<?php

namespace App\Console\Commands;

use App\Services\OrderInventoryService;
use Illuminate\Console\Command;

class ReleaseExpiredOrderInventory extends Command
{
    protected $signature = 'orders:release-expired-inventory';

    protected $description = 'Release stock reserved by expired unpaid or failed orders';

    public function handle(OrderInventoryService $inventoryService): int
    {
        $released = $inventoryService->releaseExpiredReservations();
        $this->info("Released inventory for {$released} expired order(s).");

        return self::SUCCESS;
    }
}
