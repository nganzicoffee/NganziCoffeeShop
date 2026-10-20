<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Password verification code</title></head>
<body>
    <h1>Confirm your password change</h1>
    <p>Hello {{ $userName }},</p>
    <p>Use the six-digit verification code below to confirm your Nganzi Coffee password change:</p>
    <p><strong>{{ $code }}</strong></p>
    <p>This code expires in 10 minutes. Only the newest code works if you request another.</p>
    <p>If you did not request a password change, keep this code private and change your password immediately.</p>
</body>
</html>
