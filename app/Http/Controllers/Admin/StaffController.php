<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole(StaffRole::Owner), 403);

        $users = User::query()
            ->whereNotNull('email_verified_at')
            ->when($request->input('search'), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'roleLabel' => $user->role?->label(),
                'isSelf' => $user->is(auth()->user()),
            ]);

        return Inertia::render('admin/staff', [
            'users' => $users,
            'search' => $request->string('search')->toString(),
            'roles' => collect(StaffRole::cases())->map(fn (StaffRole $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ]),
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        abort_unless($actor->hasRole(StaffRole::Owner), 403);
        abort_if($user->email_verified_at === null, 404);
        abort_if($actor->is($user), 403, 'You cannot change your own staff role.');

        $data = $request->validate([
            'role' => ['nullable', Rule::enum(StaffRole::class)],
        ]);
        $nextRole = $data['role'] === null ? null : StaffRole::from($data['role']);

        DB::transaction(function () use ($user, $nextRole, $actor): void {
            $lockedUser = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $previousRole = $lockedUser->role;

            if ($previousRole === StaffRole::Owner && $nextRole !== StaffRole::Owner) {
                $owners = User::query()->where('role', StaffRole::Owner->value)->lockForUpdate()->count();
                if ($owners <= 1) {
                    throw ValidationException::withMessages([
                        'role' => 'The last owner account cannot be demoted.',
                    ]);
                }
            }

            $lockedUser->update(['role' => $nextRole]);
            AuditLog::create([
                'actor_id' => $actor->id,
                'event' => 'staff.role_updated',
                'subject_type' => User::class,
                'subject_id' => $lockedUser->id,
                'details' => [
                    'email' => $lockedUser->email,
                    'from' => $previousRole?->value,
                    'to' => $nextRole?->value,
                ],
            ]);
        });

        return back()->with('toast', ['type' => 'success', 'message' => 'Staff role updated.']);
    }
}
