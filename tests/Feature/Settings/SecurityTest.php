<?php

use App\Mail\PasswordChangeCodeMail;
use App\Mail\PasswordChangedAlertMail;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

function sendPasswordCodeForTest($test, User $user): string
{
    Mail::fake();

    $test->actingAs($user)
        ->from(route('security.edit'))
        ->post(route('user-password.code'))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('security.edit'));

    $sentMail = null;
    Mail::assertSent(PasswordChangeCodeMail::class, function (PasswordChangeCodeMail $mail) use ($user, &$sentMail) {
        $sentMail = $mail;

        return $mail->hasTo($user->email);
    });

    assert($sentMail instanceof PasswordChangeCodeMail);

    return $sentMail->code;
}

test('security page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('security.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/security')
            ->where('email', $user->email)
            ->where('codeSent', false),
        );
});

test('password verification code is emailed and enforces a one-minute cooldown', function () {
    $user = User::factory()->create();

    sendPasswordCodeForTest($this, $user);

    $this->actingAs($user)
        ->from(route('security.edit'))
        ->post(route('user-password.code'))
        ->assertSessionHasErrors('code');

    expect(AuditLog::where('event', 'security.password_code_sent')->where('actor_id', $user->id)->exists())->toBeTrue();
});

test('password can be updated with a valid verification code, sends security alert, and signs out', function () {
    $user = User::factory()->create();
    $code = sendPasswordCodeForTest($this, $user);

    Mail::fake();

    $response = $this
        ->actingAs($user)
        ->from(route('security.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => $code,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login'))
        ->assertSessionHas('status', 'Your password has been updated. Please sign in with your new password.');

    $this->assertGuest();
    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
    expect(AuditLog::where('event', 'security.password_changed')->where('actor_id', $user->id)->exists())->toBeTrue();

    Mail::assertSent(PasswordChangedAlertMail::class, fn (PasswordChangedAlertMail $mail) => $mail->hasTo($user->email));
});

test('password cannot be updated without a valid verification code and locks after five failed attempts', function () {
    $user = User::factory()->create();
    $code = sendPasswordCodeForTest($this, $user);

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->actingAs($user)
            ->from(route('security.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
                'code' => '000000',
            ])
            ->assertSessionHasErrors('code')
            ->assertRedirect(route('security.edit'));
    }

    // Even the correct code is rejected once locked after 5 failed attempts
    $this->actingAs($user)
        ->from(route('security.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => $code,
        ])
        ->assertSessionHasErrors('code');

    expect(Hash::check('password', $user->refresh()->password))->toBeTrue();
});

test('correct current password must be provided to update password', function () {
    $user = User::factory()->create();
    $code = sendPasswordCodeForTest($this, $user);

    $response = $this
        ->actingAs($user)
        ->from(route('security.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'code' => $code,
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect(route('security.edit'));

    expect(Hash::check('password', $user->refresh()->password))->toBeTrue();
});
