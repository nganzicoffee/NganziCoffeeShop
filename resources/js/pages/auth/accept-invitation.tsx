import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AcceptInvitation({
    token,
    available,
    email,
}: {
    token: string;
    available: boolean;
    email: string | null;
}) {
    const form = useForm({ code: '', password: '', password_confirmation: '' });

    return (
        <>
            <Head title="Accept staff invitation">
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            {!available ? (
                <div className="space-y-4 text-sm">
                    <p>
                        This invitation has expired or is no longer available.
                        Ask an owner to send a new invitation.
                    </p>
                    <Link href="/login" className="underline">
                        Return to sign in
                    </Link>
                </div>
            ) : (
                <form
                    className="grid gap-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(`/staff-invitations/${token}`, {
                            onFinish: () =>
                                form.reset('password', 'password_confirmation'),
                        });
                    }}
                >
                    <p className="text-sm">
                        Set up your staff account for <strong>{email}</strong>.
                        Enter the code from your latest invitation email.
                    </p>
                    <div className="grid gap-2">
                        <Label htmlFor="code">Six-digit code</Label>
                        <Input
                            id="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            required
                            value={form.data.code}
                            onChange={(event) =>
                                form.setData('code', event.target.value)
                            }
                        />
                        <InputError message={form.errors.code} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Choose a password</Label>
                        <PasswordInput
                            id="password"
                            autoComplete="new-password"
                            minLength={12}
                            required
                            value={form.data.password}
                            onChange={(event) =>
                                form.setData('password', event.target.value)
                            }
                        />
                        <p className="text-xs text-muted">
                            Use at least 12 characters with uppercase and
                            lowercase letters, a number, and a symbol.
                        </p>
                        <InputError message={form.errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            autoComplete="new-password"
                            required
                            value={form.data.password_confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                        />
                        <InputError
                            message={form.errors.password_confirmation}
                        />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing
                            ? 'Creating account…'
                            : 'Create account'}
                    </Button>
                </form>
            )}
        </>
    );
}

AcceptInvitation.layout = {
    title: 'Join Nganzi Coffee',
    description: 'Accept your staff invitation and choose your password.',
};
