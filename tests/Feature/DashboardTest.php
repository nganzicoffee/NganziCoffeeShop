<?php

use App\Enums\StaffRole;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('users without staff access return to the storefront', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('home'));
});

test('staff dashboard entry redirects to the actual admin dashboard', function (StaffRole $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('admin.dashboard'));
})->with(StaffRole::cases());

test('unverified staff must verify before entering the dashboard', function () {
    $user = User::factory()->unverified()->create(['role' => StaffRole::Owner]);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('verification.notice'));
});
