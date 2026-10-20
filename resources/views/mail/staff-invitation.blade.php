<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Your staff invitation</title></head>
<body>
    <h1>Welcome to Nganzi Coffee</h1>
    <p>Hello {{ $staffName }}, you have been invited as {{ $roleLabel }}.</p>
    <p>Your one-time code is <strong>{{ $code }}</strong>.</p>
    <p><a href="{{ $acceptUrl }}">Set your password</a>, then enter this code and choose your own password.</p>
    <p>The invitation expires in 30 minutes. Only the newest invitation works if another is sent.</p>
    <p>If you were not expecting this invitation, ignore this email. Do not share the code.</p>
</body>
</html>
