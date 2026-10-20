<?php

use App\Enums\StaffRole;
use App\Mail\StaffInvitationMail;
use App\Models\StaffInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

function inviteStaffForTest(TestCase $test): StaffInvitationMail
{
    Mail::fake();
    $owner = User::factory()->create(['role' => StaffRole::Owner]);
    $test->actingAs($owner)->post('/admin/staff/invitations', [
        'name' => 'New Staff', 'email' => 'new@example.com', 'role' => 'order_manager',
    ])->assertSessionHasNoErrors();
    $message = null;
    Mail::assertSent(StaffInvitationMail::class, function ($mail) use (&$message) {
        $message = $mail;

        return $mail->hasTo('new@example.com');
    });

    assert($message instanceof StaffInvitationMail);

    return $message;
}

test('only owners can invite staff including other owners', function () {
    Mail::fake();
    foreach ([StaffRole::OrderManager, StaffRole::InventoryManager, StaffRole::Reporting] as $role) {
        $staff = User::factory()->create(['role' => $role]);
        $this->actingAs($staff)->post('/admin/staff/invitations', [
            'name' => 'New Owner', 'email' => 'new@example.com', 'role' => 'owner',
        ])->assertForbidden();
    }
    $owner = User::factory()->create(['role' => StaffRole::Owner]);
    $this->actingAs($owner)->post('/admin/staff/invitations', [
        'name' => 'New Owner', 'email' => 'new@example.com', 'role' => 'owner',
    ])->assertSessionHasNoErrors();
    expect(StaffInvitation::firstOrFail()->role)->toBe(StaffRole::Owner);
    expect(User::where('email', 'new@example.com')->exists())->toBeFalse();
    Mail::assertSent(StaffInvitationMail::class);
});

test('invitation acceptance page renders and sets no-store headers', function () {
    inviteStaffForTest($this);
    $invitation = StaffInvitation::firstOrFail();

    $this->get('/staff-invitations/'.$invitation->token)
        ->assertOk()
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});

test('invitation acceptance verifies email creates selected role and cannot be replayed', function () {
    $mail = inviteStaffForTest($this);
    $invitation = StaffInvitation::firstOrFail();
    expect(Hash::check($mail->code, $invitation->code_hash))->toBeTrue();
    expect($invitation->code_hash)->not->toBe($mail->code);
    $this->post('/staff-invitations/'.$invitation->token, [
        'code' => $mail->code, 'password' => 'Staff-Password123!', 'password_confirmation' => 'Staff-Password123!',
        'role' => 'owner', 'email' => 'other@example.com',
    ])->assertRedirect('/login');
    $user = User::where('email', 'new@example.com')->firstOrFail();
    expect($user->role)->toBe(StaffRole::OrderManager);
    expect($user->email_verified_at)->not->toBeNull();
    expect(Hash::check('Staff-Password123!', $user->password))->toBeTrue();
    $this->post('/staff-invitations/'.$invitation->token, [
        'code' => $mail->code, 'password' => 'Another-Password123!', 'password_confirmation' => 'Another-Password123!',
    ])->assertSessionHasErrors('code');
    expect(Hash::check('Staff-Password123!', $user->fresh()->password))->toBeTrue();
});

test('five incorrect codes persist attempts and lock the invitation', function () {
    $mail = inviteStaffForTest($this);
    $invitation = StaffInvitation::firstOrFail();
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->post('/staff-invitations/'.$invitation->token, [
            'code' => '000000', 'password' => 'Staff-Password123!', 'password_confirmation' => 'Staff-Password123!',
        ])->assertSessionHasErrors('code');
    }
    expect($invitation->fresh()->attempts)->toBe(5);
    $this->post('/staff-invitations/'.$invitation->token, [
        'code' => $mail->code, 'password' => 'Staff-Password123!', 'password_confirmation' => 'Staff-Password123!',
    ])->assertSessionHasErrors('code');
    expect(User::where('email', 'new@example.com')->exists())->toBeFalse();
});

test('resending rotates the code and link and revoking blocks acceptance', function () {
    inviteStaffForTest($this);
    $invitation = StaffInvitation::firstOrFail();
    $oldToken = $invitation->token;
    $this->travel(61)->seconds();
    $this->post('/admin/staff/invitations/'.$invitation->id.'/resend')->assertSessionHasNoErrors();
    expect($invitation->fresh()->token)->not->toBe($oldToken);
    $this->post('/staff-invitations/'.$oldToken, [
        'code' => '000000', 'password' => 'Staff-Password123!', 'password_confirmation' => 'Staff-Password123!',
    ])->assertSessionHasErrors('code');
    $this->delete('/admin/staff/invitations/'.$invitation->id)->assertSessionHasNoErrors();
    expect($invitation->fresh()->revoked_at)->not->toBeNull();
    expect($invitation->fresh()->isUsable())->toBeFalse();
});

test('expired invitations cannot create accounts', function () {
    $mail = inviteStaffForTest($this);
    $invitation = StaffInvitation::firstOrFail();
    $this->travel(31)->minutes();
    $this->post('/staff-invitations/'.$invitation->token, [
        'code' => $mail->code, 'password' => 'Staff-Password123!', 'password_confirmation' => 'Staff-Password123!',
    ])->assertSessionHasErrors('code');
    expect(User::where('email', 'new@example.com')->exists())->toBeFalse();
});

test('resending too soon is rejected and cancelled invitations can be replaced', function () {
    inviteStaffForTest($this);
    $invitation = StaffInvitation::firstOrFail();
    $this->post('/admin/staff/invitations/'.$invitation->id.'/resend')->assertSessionHasErrors('invitation');
    $this->delete('/admin/staff/invitations/'.$invitation->id)->assertSessionHasNoErrors();
    $this->post('/admin/staff/invitations', [
        'name' => 'New Staff', 'email' => 'new@example.com', 'role' => 'reporting',
    ])->assertSessionHasNoErrors();
    expect(StaffInvitation::count())->toBe(1);
    expect($invitation->fresh()->revoked_at)->toBeNull();
    expect($invitation->fresh()->role)->toBe(StaffRole::Reporting);
});

test('existing accounts cannot be overwritten by invitations', function () {
    Mail::fake();
    $owner = User::factory()->create(['role' => StaffRole::Owner]);
    $existing = User::factory()->create(['email' => 'existing@example.com']);
    $this->actingAs($owner)->post('/admin/staff/invitations', [
        'name' => 'Replacement', 'email' => $existing->email, 'role' => 'owner',
    ])->assertSessionHasErrors('email');
    expect($existing->fresh()->name)->toBe($existing->name);
    Mail::assertNothingSent();
});

test('failed delivery leaves a visible retryable invitation without creating a user', function () {
    Mail::shouldReceive('to')->once()->andThrow(new RuntimeException('Sensitive SMTP details'));
    $owner = User::factory()->create(['role' => StaffRole::Owner]);
    $this->actingAs($owner)->post('/admin/staff/invitations', [
        'name' => 'New Staff', 'email' => 'new@example.com', 'role' => 'reporting',
    ])->assertSessionHasErrors('invitation');
    $invitation = StaffInvitation::firstOrFail();
    expect($invitation->sent_at)->toBeNull();
    expect($invitation->isUsable())->toBeFalse();
    expect(User::where('email', 'new@example.com')->exists())->toBeFalse();
});

test('staff CLI creates verified accounts', function () {
    $this->artisan('staff:create', [
        'email' => 'cli@example.com', '--name' => 'CLI Owner', '--role' => 'owner', '--password' => 'Staff-Password123!',
    ])->assertSuccessful();
    expect(User::where('email', 'cli@example.com')->firstOrFail()->email_verified_at)->not->toBeNull();
});
