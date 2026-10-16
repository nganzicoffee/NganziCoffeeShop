<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole(StaffRole::Owner), 403);

        return Inertia::render('admin/audit-log', [
            'entries' => AuditLog::query()
                ->with('actor:id,name')
                ->latest()
                ->paginate(50)
                ->through(fn (AuditLog $entry): array => [
                    'event' => $entry->event,
                    'actor' => $entry->actor->name ?? 'System',
                    'subject' => $entry->subject_type ? class_basename($entry->subject_type) : null,
                    'subjectId' => $entry->subject_id,
                    'details' => $entry->details,
                    'createdAt' => $entry->created_at?->toDateTimeString(),
                ]),
        ]);
    }
}
