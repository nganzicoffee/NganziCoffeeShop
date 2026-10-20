<?php

namespace App\Services;

use App\Mail\StaffInvitationMail;
use App\Models\AuditLog;
use App\Models\StaffInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class StaffInvitationService
{
    public function send(StaffInvitation $invitation, User $actor): void
    {
        // Do not silently write real invitation codes to production logs.
        if (app()->isProduction() && ! in_array(config('mail.default'), ['smtp', 'sendmail', 'ses', 'postmark', 'resend'], true)) {
            throw ValidationException::withMessages(['invitation' => 'Configure outgoing email before sending staff invitations.']);
        }

        $code = (string) random_int(100000, 999999);
        $delivery = DB::transaction(/** @return array{string, string, string, string} */ function () use ($invitation, $actor, $code): array {
            $locked = StaffInvitation::query()->whereKey($invitation->id)->lockForUpdate()->firstOrFail();
            if ($locked->accepted_at !== null || $locked->revoked_at !== null) {
                throw ValidationException::withMessages(['invitation' => 'This invitation is no longer pending.']);
            }
            if ($locked->sent_at?->gt(now()->subMinute())) {
                throw ValidationException::withMessages(['invitation' => 'Wait one minute before resending an invitation.']);
            }
            if (User::query()->where('email', $locked->email)->exists()) {
                throw ValidationException::withMessages(['invitation' => 'This email already has an account. Use the existing account instead.']);
            }
            $locked->update([
                'token' => Str::random(64),
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(30),
                // Reserve the send slot while delivery is in progress.
                'sent_at' => now(),
            ]);
            AuditLog::create([
                'actor_id' => $actor->id,
                'event' => 'staff.invitation_sent',
                'subject_type' => StaffInvitation::class,
                'subject_id' => $locked->id,
                'details' => ['email' => $locked->email, 'role' => $locked->role->value],
            ]);

            return [$locked->email, $locked->name, $locked->role->label(), $locked->token];
        });

        try {
            // Send immediately: invitation delivery does not depend on a queue worker.
            Mail::to($delivery[0])->send(new StaffInvitationMail(
                $delivery[1], $delivery[2], $code,
                route('staff-invitations.show', ['token' => $delivery[3]]),
            ));
        } catch (Throwable) {
            // Never expose mail credentials or the code via exception messages.
            StaffInvitation::query()->whereKey($invitation->id)->where('token', $delivery[3])
                ->update(['sent_at' => null, 'expires_at' => now()]);
            throw ValidationException::withMessages(['invitation' => 'Email delivery failed. Check outgoing email settings, then resend the invitation.']);
        }
    }

    public function accept(string $token, string $code, string $password): void
    {
        // Return validation errors after committing so incorrect attempts remain counted.
        $error = DB::transaction(function () use ($token, $code, $password): ?string {
            $invitation = StaffInvitation::query()->where('token', $token)->lockForUpdate()->first();
            if (! $invitation || ! $invitation->isUsable()) {
                return 'This invitation has expired or is no longer available. Ask an owner to send a new invitation.';
            }
            if (! Hash::check($code, $invitation->code_hash)) {
                $invitation->increment('attempts');

                return 'The code is incorrect. After five incorrect attempts, a new invitation is required.';
            }
            if (User::query()->where('email', $invitation->email)->exists()) {
                return 'An account already exists for this email. Sign in or reset its password.';
            }

            $user = User::forceCreate([
                'name' => $invitation->name,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);
            $invitation->update(['accepted_at' => now()]);
            AuditLog::create([
                'actor_id' => $user->id,
                'event' => 'staff.invitation_accepted',
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'details' => ['invited_by' => $invitation->invited_by, 'role' => $invitation->role->value],
            ]);

            return null;
        });

        if ($error !== null) {
            throw ValidationException::withMessages(['code' => $error]);
        }
    }
}
