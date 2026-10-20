<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Password changed security alert</title></head>
<body>
    <h1>Your password was changed</h1>
    <p>Hello {{ $userName }},</p>
    <p>The password for your Nganzi Coffee account was changed on {{ $changedAt }}@if ($ipAddress) (IP: {{ $ipAddress }})@endif.</p>
    <p>If you made this change, no further action is needed. You have been signed out and can sign back in with your new password.</p>
    <p>If you did not authorize this change, reset your password immediately or contact an account owner.</p>
</body>
</html>
