<?php

namespace App\Http\Controllers;

use App\Models\StaffInvitation;
use App\Services\StaffInvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class StaffInvitationController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $invitation = StaffInvitation::query()->where('token', $token)->first();

        $response = Inertia::render('auth/accept-invitation', [
            'token' => $token,
            'available' => $invitation?->isUsable() ?? false,
            'email' => $invitation?->isUsable() ? $invitation->email : null,
        ])->toResponse($request);

        $response->headers->add([
            'Cache-Control' => 'no-store, private',
            'Referrer-Policy' => 'no-referrer',
            'X-Robots-Tag' => 'noindex, nofollow',
        ]);

        return $response;
    }

    public function store(Request $request, string $token, StaffInvitationService $service): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols()],
        ]);
        $service->accept($token, $data['code'], $data['password']);

        return redirect()->route('login')->with('status', 'Your staff account is ready. Sign in with your new password.');
    }
}
