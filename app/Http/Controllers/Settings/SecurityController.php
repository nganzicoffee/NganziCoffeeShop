<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Mail\PasswordChangedAlertMail;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\PasswordChangeVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SecurityController extends Controller
{
    /**
     * Show the user's security settings page.
     */
    public function edit(
        TwoFactorAuthenticationRequest $request,
        PasswordChangeVerificationService $verification,
    ): Response {
        /** @var User $user */
        $user = $request->user();

        $props = [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'email' => $user->email,
            'codeSent' => $verification->hasActiveCode($user),
            'status' => $request->session()->get('status'),
        ];

        return Inertia::render('settings/security', $props);
    }

    /**
     * Send a 6-digit email verification code for changing the user's password.
     */
    public function sendCode(
        Request $request,
        PasswordChangeVerificationService $verification,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $verification->sendCode($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Verification code sent to :email.', ['email' => $user->email]),
        ]);

        return back()->with('status', 'password-code-sent');
    }

    /**
     * Update the user's password after verifying the 6-digit email code, then sign out.
     */
    public function update(
        PasswordUpdateRequest $request,
        PasswordChangeVerificationService $verification,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $verification->verifyAndConsume($user, (string) $request->validated('code'));

        $user->forceFill([
            'password' => $request->password,
            'remember_token' => Str::random(60),
        ])->save();

        AuditLog::create([
            'actor_id' => $user->id,
            'event' => 'security.password_changed',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'details' => [
                'email' => $user->email,
                'ip' => $request->ip(),
            ],
        ]);

        try {
            Mail::to($user->email)->send(new PasswordChangedAlertMail(
                $user->name,
                now()->toDayDateTimeString(),
                $request->ip(),
            ));
        } catch (Throwable) {
            // Do not block sign-out if the post-change alert email encounters a transient error.
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('login')
            ->with('status', __('Your password has been updated. Please sign in with your new password.'));
    }
}
